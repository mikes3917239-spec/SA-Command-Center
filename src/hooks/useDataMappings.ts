import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/auth-store';
import type { MappingTemplate, NetSuiteRecordType, FieldMapping } from '@/types';

function docToTemplate(id: string, data: Record<string, unknown>): MappingTemplate {
  return {
    id,
    userId: data.userId as string,
    name: (data.name as string) || '',
    recordType: (data.recordType as NetSuiteRecordType) || 'customer',
    mappings: (data.mappings as FieldMapping[]) || [],
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export function useDataMappings() {
  const user = useAuthStore((s) => s.user);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'dataMappings'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs
          .map((d) => docToTemplate(d.id, d.data()))
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setTemplates(results);
        setLoading(false);
      },
      (err) => {
        console.error('dataMappings query error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const createTemplate = useCallback(
    async (data: { name: string; recordType: NetSuiteRecordType; mappings: FieldMapping[] }) => {
      if (!user) throw new Error('Not authenticated');
      const docRef = await addDoc(collection(db, 'dataMappings'), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [user]
  );

  const updateTemplate = useCallback(
    async (
      templateId: string,
      data: Partial<{ name: string; recordType: NetSuiteRecordType; mappings: FieldMapping[] }>
    ) => {
      await updateDoc(doc(db, 'dataMappings', templateId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteTemplate = useCallback(async (templateId: string) => {
    await deleteDoc(doc(db, 'dataMappings', templateId));
  }, []);

  return { templates, loading, createTemplate, updateTemplate, deleteTemplate };
}
