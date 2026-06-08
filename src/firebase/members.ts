import { ref, push, remove, update, onValue, off } from 'firebase/database'
import { db } from './config'
import type { Member } from '../types'

const hRef = (householdId: string, path: string) =>
    ref(db, `households/${householdId}/${path}`)

export const addMember = (householdId: string, member: Omit<Member, 'id'>) =>
    push(hRef(householdId, 'members'), member)

export const removeMember = (householdId: string, id: string) =>
    remove(hRef(householdId, `members/${id}`))

export const updateMember = (householdId: string, id: string, data: Partial<Member>) =>
    update(hRef(householdId, `members/${id}`), data)

export const subscribeMembers = (householdId: string, cb: (members: Member[]) => void) => {
    const r = hRef(householdId, 'members')
    onValue(r, (snap) => {
        const data = snap.val() ?? {}
        cb(Object.entries(data).map(([id, val]) => ({ id, ...(val as Omit<Member, 'id'>) })))
    })
    return () => off(r)
}
