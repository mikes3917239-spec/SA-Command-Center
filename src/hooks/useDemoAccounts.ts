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
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/auth-store';
import type { DemoAccount, DemoEnvironment, DemoStatus } from '@/types';

function docToAccount(id: string, data: Record<string, unknown>): DemoAccount {
  return {
    id,
    userId: data.userId as string,
    name: (data.name as string) || '',
    description: (data.description as string) || '',
    environment: (data.environment as DemoEnvironment) || 'sandbox',
    accountId: (data.accountId as string) || '',
    suiteAppUrl: (data.suiteAppUrl as string) || '',
    status: (data.status as DemoStatus) || 'unknown',
    lastChecked: data.lastChecked instanceof Timestamp ? data.lastChecked.toDate() : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export function useDemoAccounts() {
  const user = useAuthStore((s) => s.user);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'mcpConfigs'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((d) => docToAccount(d.id, d.data()));
        setAccounts(results);
        setLoading(false);
      },
      (err) => {
        console.error('Demo accounts query error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const createAccount = useCallback(
    async (data: {
      name: string;
      description: string;
      environment: DemoEnvironment;
      accountId: string;
      suiteAppUrl: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const docRef = await addDoc(collection(db, 'mcpConfigs'), {
        ...data,
        userId: user.uid,
        status: 'unknown',
        lastChecked: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [user]
  );

  const updateAccount = useCallback(
    async (
      accountId: string,
      data: Partial<{
        name: string;
        description: string;
        environment: DemoEnvironment;
        accountId: string;
        suiteAppUrl: string;
        status: DemoStatus;
      }>
    ) => {
      await updateDoc(doc(db, 'mcpConfigs', accountId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteAccount = useCallback(async (accountId: string) => {
    await deleteDoc(doc(db, 'mcpConfigs', accountId));
  }, []);

  return { accounts, loading, createAccount, updateAccount, deleteAccount };
}
