// src/hooks/useHouseholdMeta.ts
import { useEffect, useState } from 'react'
import { subscribeHouseholdMeta, updateHouseholdMeta, updateMember } from '../firebase/db'
import type { HouseholdMeta, HouseholdSettings, Member } from '../types'

export function useHouseholdMeta(householdId: string, currentUserId?: string) {
    const [meta, setMeta] = useState<HouseholdMeta | null>(null)

    useEffect(() => {
        if (!householdId) return
        return subscribeHouseholdMeta(householdId, setMeta)
    }, [householdId])

    const isOwner = Boolean(meta && currentUserId && meta.ownerId === currentUserId)
    const expensesOnly = meta?.settings?.expensesOnly ?? false

    const updateSettings = (settings: Partial<HouseholdSettings>) =>
        updateHouseholdMeta(householdId, {
            settings: { ...(meta?.settings ?? {}), ...settings },
        })

    const renameMeta = (name: string) => updateHouseholdMeta(householdId, { name })

    const toggleMemberIncome = (member: Member) =>
        updateMember(householdId, member.id, { privateIncome: !member.privateIncome })

    return { meta, isOwner, expensesOnly, updateSettings, renameMeta, toggleMemberIncome }
}
