import { useState, useEffect, useCallback, useRef } from 'react';
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
import { DEFAULT_TEMPLATE_SECTIONS } from '@/features/notes/note-templates';
import type { NoteTemplate, NoteType, TemplateSectionDef } from '@/types';

function docToTemplate(id: string, data: Record<string, unknown>): NoteTemplate {
  return {
    id,
    userId: data.userId as string,
    name: (data.name as string) || '',
    noteType: (data.noteType as NoteType) || 'general',
    sections: ((data.sections as TemplateSectionDef[]) || []).map((s) => ({
      ...s,
      defaultContent: s.defaultContent || '',
    })),
    isBuiltIn: (data.isBuiltIn as boolean) ?? false,
    color: (data.color as string) || '#6b7280',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export function useNoteTemplates() {
  const user = useAuthStore((s) => s.user);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'noteTemplates'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs
          .map((d) => docToTemplate(d.id, d.data()))
          .sort((a, b) => a.name.localeCompare(b.name));
        setTemplates(results);
        setLoading(false);

        // Seed defaults if no templates exist
        if (results.length === 0 && !seededRef.current) {
          seededRef.current = true;
          seedDefaults(user.uid);
        }
      },
      (err) => {
        console.error('noteTemplates query error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const seedDefaults = async (userId: string) => {
    const entries = Object.entries(DEFAULT_TEMPLATE_SECTIONS);
    for (const [key, def] of entries) {
      await addDoc(collection(db, 'noteTemplates'), {
        userId,
        name: def.name,
        noteType: key as NoteType,
        sections: def.sections,
        isBuiltIn: true,
        color: def.color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const createTemplate = useCallback(
    async (data: {
      name: string;
      noteType: NoteType;
      sections: TemplateSectionDef[];
      color: string;
      isBuiltIn?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const docRef = await addDoc(collection(db, 'noteTemplates'), {
        ...data,
        isBuiltIn: data.isBuiltIn ?? false,
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
      data: Partial<{
        name: string;
        noteType: NoteType;
        sections: TemplateSectionDef[];
        color: string;
      }>
    ) => {
      await updateDoc(doc(db, 'noteTemplates', templateId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteTemplate = useCallback(async (templateId: string) => {
    await deleteDoc(doc(db, 'noteTemplates', templateId));
  }, []);

  const resetBuiltIn = useCallback(
    async (templateId: string, templateKey: string) => {
      const def = DEFAULT_TEMPLATE_SECTIONS[templateKey];
      if (!def) return;
      await updateDoc(doc(db, 'noteTemplates', templateId), {
        name: def.name,
        noteType: templateKey as NoteType,
        sections: def.sections,
        color: def.color,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  return { templates, loading, createTemplate, updateTemplate, deleteTemplate, resetBuiltIn };
}
