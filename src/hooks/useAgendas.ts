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
import type { Agenda, AgendaStatus, TeamMember, AgendaSection } from '@/types';

function docToAgenda(id: string, data: Record<string, unknown>): Agenda {
  return {
    id,
    userId: data.userId as string,
    customerName: (data.customerName as string) || '',
    title: (data.title as string) || '',
    dateTime: (data.dateTime as string) || '',
    timezone: (data.timezone as string) || 'America/New_York',
    customerTeam: (data.customerTeam as TeamMember[]) || [],
    netsuiteTeam: (data.netsuiteTeam as TeamMember[]) || [],
    sections: (data.sections as AgendaSection[]) || [],
    status: (data.status as AgendaStatus) || 'draft',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export function useAgendas() {
  const user = useAuthStore((s) => s.user);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAgendas([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'agendas'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs
          .map((d) => docToAgenda(d.id, d.data()))
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setAgendas(results);
        setLoading(false);
      },
      (err) => {
        console.error('Agendas query error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const createAgenda = useCallback(
    async (data: {
      customerName: string;
      title: string;
      dateTime: string;
      timezone: string;
      customerTeam: TeamMember[];
      netsuiteTeam: TeamMember[];
      sections: AgendaSection[];
      status: AgendaStatus;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const docRef = await addDoc(collection(db, 'agendas'), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [user]
  );

  const updateAgenda = useCallback(
    async (
      agendaId: string,
      data: Partial<{
        customerName: string;
        title: string;
        dateTime: string;
        timezone: string;
        customerTeam: TeamMember[];
        netsuiteTeam: TeamMember[];
        sections: AgendaSection[];
        status: AgendaStatus;
      }>
    ) => {
      await updateDoc(doc(db, 'agendas', agendaId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteAgenda = useCallback(async (agendaId: string) => {
    await deleteDoc(doc(db, 'agendas', agendaId));
  }, []);

  return { agendas, loading, createAgenda, updateAgenda, deleteAgenda };
}
