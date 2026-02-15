import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/auth-store';
import type { Document, DocumentType, DocumentSourceType } from '@/types';

function docToDocument(id: string, data: Record<string, unknown>): Document {
  return {
    id,
    userId: data.userId as string,
    name: (data.name as string) || '',
    type: (data.type as DocumentType) || 'other',
    mimeType: (data.mimeType as string) || '',
    size: (data.size as number) || 0,
    storagePath: (data.storagePath as string) || '',
    downloadUrl: (data.downloadUrl as string) || '',
    sourceType: (data.sourceType as DocumentSourceType) || 'agenda',
    sourceId: (data.sourceId as string) || '',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  };
}

export function useDocuments(sourceType?: DocumentSourceType, sourceId?: string) {
  const user = useAuthStore((s) => s.user);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const constraints = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    const q = query(collection(db, 'documents'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let results = snapshot.docs.map((d) => docToDocument(d.id, d.data()));
        if (sourceType) {
          results = results.filter((r) => r.sourceType === sourceType);
        }
        if (sourceId) {
          results = results.filter((r) => r.sourceId === sourceId);
        }
        setDocuments(results);
        setLoading(false);
      },
      (err) => {
        console.error('Documents query error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, sourceType, sourceId]);

  const uploadDocument = useCallback(
    async (
      file: File,
      source: { type: DocumentSourceType; id: string }
    ): Promise<Document> => {
      if (!user) throw new Error('Not authenticated');

      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const storagePath = `documents/${user.uid}/${fileId}-${file.name}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const typeMap: Record<string, DocumentType> = {
        pdf: 'pdf',
        csv: 'csv',
        xlsx: 'xlsx',
        xls: 'xlsx',
        json: 'json',
      };

      const docData = {
        userId: user.uid,
        name: file.name,
        type: typeMap[ext] || 'other',
        mimeType: file.type,
        size: file.size,
        storagePath,
        downloadUrl,
        sourceType: source.type,
        sourceId: source.id,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'documents'), docData);

      return {
        id: docRef.id,
        userId: user.uid,
        name: file.name,
        type: typeMap[ext] || 'other',
        mimeType: file.type,
        size: file.size,
        storagePath,
        downloadUrl,
        sourceType: source.type,
        sourceId: source.id,
        createdAt: new Date(),
      };
    },
    [user]
  );

  const deleteDocument = useCallback(
    async (document: Document) => {
      const storageRef = ref(storage, document.storagePath);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'documents', document.id));
    },
    []
  );

  return { documents, loading, uploadDocument, deleteDocument };
}
