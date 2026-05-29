// src/hooks/useMembers.ts
import { useEffect, useState } from 'react';
import { subscribeMembers, addMember, removeMember } from '../firebase/db';
import type { Member } from '../types';

// Colors matching the old app: itay=purple, aviv=green, sapir=pink, then more
const CARD_COLORS = [
    '#6C63FF', '#10B981', '#EC4899', '#F59E0B',
    '#845EF7', '#3B82F6', '#20C997', '#FF922B',
];

export const useMembers = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const unsub = subscribeMembers((data) => {
            setMembers(data);
            setReady(true);
        });
        return unsub;
    }, []);

    const add = (name: string, nameEn?: string, userId?: string) => {
        const color = CARD_COLORS[members.length % CARD_COLORS.length];
        return addMember({
            name,
            ...(nameEn ? { nameEn } : {}),
            ...(userId ? { userId } : {}),
            color,
            createdAt: Date.now(),
        });
    };

    const remove = (id: string) => removeMember(id);

    return { members, ready, add, remove };
};