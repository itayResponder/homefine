// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../firebase/config';
import type { AppUser } from '../types';

const WHITELIST = [
    'itay.responder@gmail.com',
    'aviv.rom01@gmail.com',
    'sapir.rahamim21@gmail.com',
];

export const useAuth = () => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                if (WHITELIST.includes(firebaseUser.email ?? '')) {
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email!,
                        displayName: firebaseUser.displayName ?? '',
                        photoURL: firebaseUser.photoURL ?? undefined,
                    });
                    setUnauthorized(false);
                } else {
                    signOut(auth);
                    setUnauthorized(true);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = () => signInWithPopup(auth, provider);
    const logout = () => signOut(auth);

    return { user, loading, unauthorized, login, logout };
};