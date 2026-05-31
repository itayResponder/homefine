// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../firebase/config';
import type { AppUser } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    displayName: firebaseUser.displayName ?? '',
                    photoURL: firebaseUser.photoURL ?? undefined,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = () => signInWithPopup(auth, provider);
    const logout = () => signOut(auth);

    return { user, loading, login, logout };
};
