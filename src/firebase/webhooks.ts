import { ref, set, remove, onValue, off, get } from 'firebase/database'
import { db } from './config'
import type { WebhookConfig } from '../types'

export const saveWebhookConfig = async (
    uid: string,
    householdId: string,
    config: WebhookConfig,
    oldApiKey?: string,
): Promise<void> => {
    if (oldApiKey) await remove(ref(db, `webhookKeys/${oldApiKey}`))
    await set(ref(db, `webhookKeys/${config.apiKey}`), { uid, householdId: config.householdId, memberId: config.memberId })
    await set(ref(db, `userPrefs/${uid}/webhookConfigs/${householdId}`), config)
}

export const deleteWebhookConfig = async (uid: string, householdId: string, apiKey: string): Promise<void> => {
    await remove(ref(db, `webhookKeys/${apiKey}`))
    await remove(ref(db, `userPrefs/${uid}/webhookConfigs/${householdId}`))
}

export const subscribeWebhookConfig = (uid: string, householdId: string, cb: (config: WebhookConfig | null) => void) => {
    const r = ref(db, `userPrefs/${uid}/webhookConfigs/${householdId}`)
    onValue(r, (snap) => cb(snap.val() ?? null))
    return () => off(r)
}

export type WebhookDebugEntry = {
    id: string
    title: string
    body: string
    ts: number
    status: 'received' | 'parse_failed' | 'ok'
    transactionId?: string
    isTest?: boolean
}

export const subscribeWebhookDebug = (householdId: string, cb: (entries: WebhookDebugEntry[]) => void) => {
    const r = ref(db, `households/${householdId}/webhookDebug`)
    onValue(r, (snap) => {
        if (!snap.exists()) { cb([]); return }
        const entries: WebhookDebugEntry[] = Object.entries(snap.val() as Record<string, Omit<WebhookDebugEntry, 'id'>>)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => b.ts - a.ts)
        cb(entries)
    })
    return () => off(r)
}

export const deleteWebhookDebugEntry = (householdId: string, id: string) =>
    remove(ref(db, `households/${householdId}/webhookDebug/${id}`))

export const deleteWebhookDebugEntries = (householdId: string, ids: string[]) =>
    Promise.all(ids.map(id => remove(ref(db, `households/${householdId}/webhookDebug/${id}`))))

export const getAllWebhookConfigs = async (uid: string): Promise<Record<string, WebhookConfig>> => {
    const snap = await get(ref(db, `userPrefs/${uid}/webhookConfigs`))
    return snap.val() ?? {}
}
