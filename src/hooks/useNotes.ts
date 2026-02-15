import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/auth-store';
import type { Note, NoteType, Attachment } from '@/types';

function docToNote(id: string, data: Record<string, unknown>): Note {
  return {
    id,
    userId: data.userId as string,
    title: data.title as string,
    content: data.content as string,
    tags: (data.tags as string[]) || [],
    type: (data.type as NoteType) || 'general',
    customer: (data.customer as string) || '',
    opportunity: (data.opportunity as string) || '',
    websiteUrl: (data.websiteUrl as string) || '',
    attachments: ((data.attachments as Attachment[]) || []).map((a) => ({
      ...a,
      uploadedAt: a.uploadedAt instanceof Timestamp ? (a.uploadedAt as unknown as Timestamp).toDate() : new Date(a.uploadedAt),
    })),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export function useNotes() {
  const user = useAuthStore((s) => s.user);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((d) => docToNote(d.id, d.data()));
        setNotes(results);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore query error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const createNote = useCallback(
    async (data: {
      title: string;
      content: string;
      tags: string[];
      type: NoteType;
      customer: string;
      opportunity: string;
      websiteUrl: string;
      attachments?: Attachment[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const docRef = await addDoc(collection(db, 'notes'), {
        ...data,
        attachments: data.attachments || [],
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [user]
  );

  const updateNote = useCallback(
    async (
      noteId: string,
      data: Partial<{
        title: string;
        content: string;
        tags: string[];
        type: NoteType;
        customer: string;
        opportunity: string;
        websiteUrl: string;
        attachments: Attachment[];
      }>
    ) => {
      await updateDoc(doc(db, 'notes', noteId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const uploadAttachment = useCallback(
    async (noteId: string, file: File): Promise<Attachment> => {
      if (!user) throw new Error('Not authenticated');
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const storagePath = `notes/${user.uid}/${noteId}/${fileId}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return {
        id: fileId,
        name: file.name,
        url,
        size: file.size,
        type: file.type,
        storagePath,
        uploadedAt: new Date(),
      };
    },
    [user]
  );

  const deleteAttachment = useCallback(
    async (attachment: Attachment) => {
      const storageRef = ref(storage, attachment.storagePath);
      await deleteObject(storageRef);
    },
    []
  );

  const deleteNote = useCallback(async (noteId: string) => {
    await deleteDoc(doc(db, 'notes', noteId));
  }, []);

  return { notes, loading, createNote, updateNote, deleteNote, uploadAttachment, deleteAttachment };
}
