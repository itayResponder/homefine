import { ref, push, set, remove, update, onValue, off, get } from 'firebase/database'
import { db } from './config'
import { DEFAULT_CATEGORY_SEEDS } from '../constants/categories'
import type { Category, HouseholdMeta } from '../types'

const hRef = (householdId: string, path: string) =>
    ref(db, `households/${householdId}/${path}`)

// ─── Households ──────────────────────────────────────────────────────────────
export const createHousehold = async (name: string, ownerId: string): Promise<string> => {
    const newRef = push(ref(db, 'households'))
    const householdId = newRef.key!
    const meta: HouseholdMeta = { name, ownerId, createdAt: Date.now() }
    await set(ref(db, `households/${householdId}/meta`), meta)
    await set(ref(db, `userHouseholds/${ownerId}/${householdId}`), true)
    return householdId
}

export const getHouseholdMeta = async (householdId: string): Promise<HouseholdMeta | null> => {
    const snap = await get(ref(db, `households/${householdId}/meta`))
    return snap.exists() ? (snap.val() as HouseholdMeta) : null
}

export const joinHousehold = async (householdId: string, uid: string): Promise<void> => {
    await set(ref(db, `userHouseholds/${uid}/${householdId}`), true)
}

export const leaveHousehold = async (householdId: string, uid: string): Promise<void> => {
    await remove(ref(db, `userHouseholds/${uid}/${householdId}`))
    await remove(ref(db, `households/${householdId}/participants/${uid}`)).catch(() => {})
    await remove(hRef(householdId, `presence/${uid}`)).catch(() => {})
}

export const deleteHousehold = async (householdId: string): Promise<void> => {
    const snap = await get(ref(db, `households/${householdId}/participants`))
    const uids: string[] = snap.exists() ? Object.keys(snap.val()) : []
    await Promise.all(uids.map(uid => remove(ref(db, `userHouseholds/${uid}/${householdId}`))))
    await remove(ref(db, `households/${householdId}`))
}

export const getUserHouseholdIds = async (uid: string): Promise<string[]> => {
    const snap = await get(ref(db, `userHouseholds/${uid}`))
    return snap.exists() ? Object.keys(snap.val()) : []
}

export const subscribeUserHouseholds = (uid: string, cb: (ids: string[]) => void) => {
    const r = ref(db, `userHouseholds/${uid}`)
    onValue(r, (snap) => cb(snap.exists() ? Object.keys(snap.val()) : []))
    return () => off(r)
}

export const updateHouseholdMeta = (householdId: string, data: Partial<HouseholdMeta>) =>
    update(ref(db, `households/${householdId}/meta`), data)

export const subscribeHouseholdMeta = (
    householdId: string,
    cb: (meta: HouseholdMeta | null) => void,
) => {
    const r = ref(db, `households/${householdId}/meta`)
    onValue(r, (snap) => cb(snap.val() ?? null))
    return () => off(r)
}

// ─── Connection state ─────────────────────────────────────────────────────────
export const subscribeConnectionState = (cb: (connected: boolean) => void) => {
    const r = ref(db, '.info/connected')
    onValue(r, (snap) => cb(snap.val() === true))
    return () => off(r)
}

// ─── Join Requests ────────────────────────────────────────────────────────────
type JoinRequestData = { name: string; email: string; photoURL?: string; ts: number; nameHe?: string; nameEn?: string }

export const createJoinRequest = (householdId: string, uid: string, data: JoinRequestData) =>
    set(ref(db, `households/${householdId}/joinRequests/${uid}`), data)

export const approveJoinRequest = async (
    householdId: string,
    uid: string,
    participantData?: { name: string; email: string; photoURL?: string },
    memberNameData?: { nameHe: string; nameEn?: string },
): Promise<void> => {
    await set(ref(db, `userHouseholds/${uid}/${householdId}`), true)
    await remove(ref(db, `households/${householdId}/joinRequests/${uid}`))
    if (participantData) {
        await set(ref(db, `households/${householdId}/participants/${uid}`), { ...participantData, joinedAt: Date.now() })
    }
    if (memberNameData) {
        await push(hRef(householdId, 'members'), {
            name: memberNameData.nameHe,
            ...(memberNameData.nameEn ? { nameEn: memberNameData.nameEn } : {}),
            userId: uid,
            color: '#2563EB',
            createdAt: Date.now(),
        })
    }
}

export const denyJoinRequest = (householdId: string, uid: string) =>
    remove(ref(db, `households/${householdId}/joinRequests/${uid}`))

export const subscribeJoinRequests = (
    householdId: string,
    cb: (requests: Array<JoinRequestData & { uid: string }>) => void,
) => {
    const r = ref(db, `households/${householdId}/joinRequests`)
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([uid, val]) => ({ uid, ...(val as JoinRequestData) })))
    })
    return () => off(r)
}

// ─── Participants ─────────────────────────────────────────────────────────────
type ParticipantData = { name: string; email: string; photoURL?: string; joinedAt: number }

export const subscribeUserMembership = (
    householdId: string,
    uid: string,
    cb: (isMember: boolean) => void,
) => {
    const r = ref(db, `userHouseholds/${uid}/${householdId}`)
    onValue(r, (snap) => cb(snap.val() === true))
    return () => off(r)
}

export const seedParticipant = async (householdId: string, uid: string, data: ParticipantData): Promise<void> => {
    const r = ref(db, `households/${householdId}/participants/${uid}`)
    const snap = await get(r)
    if (!snap.exists()) await set(r, data)
}

export const subscribeParticipants = (
    householdId: string,
    cb: (participants: Array<ParticipantData & { uid: string }>) => void,
) => {
    const r = ref(db, `households/${householdId}/participants`)
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([uid, val]) => ({ uid, ...(val as ParticipantData) })))
    })
    return () => off(r)
}

export const removeParticipant = async (householdId: string, uid: string): Promise<void> => {
    await remove(ref(db, `userHouseholds/${uid}/${householdId}`))
    await remove(ref(db, `households/${householdId}/participants/${uid}`))
    await remove(hRef(householdId, `presence/${uid}`)).catch(() => {})
}

// ─── User Preferences ─────────────────────────────────────────────────────────
export const setUserColor = (uid: string, color: string) =>
    set(ref(db, `userPrefs/${uid}/primaryColor`), color)

export const subscribeUserColor = (uid: string, cb: (color: string | null) => void) => {
    const r = ref(db, `userPrefs/${uid}/primaryColor`)
    onValue(r, (snap) => cb(snap.val()))
    return () => off(r)
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const seedCategories = async (householdId: string): Promise<void> => {
    const updates: Record<string, Omit<Category, 'id'>> = {}
    for (const { id, ...rest } of DEFAULT_CATEGORY_SEEDS) {
        updates[`households/${householdId}/categories/${id}`] = rest
    }
    await update(ref(db), updates)
}

export const subscribeCategories = (householdId: string, cb: (cats: Category[]) => void) => {
    const r = hRef(householdId, 'categories')
    onValue(r, (snap) => {
        if (!snap.exists()) { cb([]); return }
        const cats: Category[] = Object.entries(snap.val() as Record<string, Omit<Category, 'id'>>)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => a.order - b.order)
        cb(cats)
    })
    return () => off(r)
}

export const seedSingleCategory = (householdId: string, id: string, data: Omit<Category, 'id'>) =>
    set(hRef(householdId, `categories/${id}`), data)

export const addCategory = (householdId: string, cat: Omit<Category, 'id'>): Promise<string> =>
    push(hRef(householdId, 'categories'), cat).then((r) => r.key!)

export const updateCategory = (householdId: string, id: string, data: Partial<Omit<Category, 'id'>>) =>
    update(hRef(householdId, `categories/${id}`), data)

export const deleteCategory = (householdId: string, id: string) =>
    remove(hRef(householdId, `categories/${id}`))

// ─── Webhook household name helper ────────────────────────────────────────────
export const getHouseholdName = async (householdId: string): Promise<string> => {
    const snap = await get(ref(db, `households/${householdId}/meta/name`))
    return snap.val() ?? householdId
}

