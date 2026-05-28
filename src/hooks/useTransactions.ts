// src/hooks/useTransactions.ts
import { useEffect, useState } from 'react';
import {
    subscribeTransactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
} from '../firebase/db';
import type { Transaction } from '../types';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const unsub = subscribeTransactions(setTransactions);
        return unsub;
    }, []);

    const add = (tx: Omit<Transaction, 'id'>) => addTransaction(tx);
    const remove = (id: string) => removeTransaction(id);
    const update = (id: string, data: Partial<Transaction>) => updateTransaction(id, data);

    return { transactions, add, remove, update };
};