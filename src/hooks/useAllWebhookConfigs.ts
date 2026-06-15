import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase/config'
import type { WebhookConfig } from '../types'

export interface HouseholdWebhookConfig extends WebhookConfig {
  householdId: string
}

export function useAllWebhookConfigs(uid: string): HouseholdWebhookConfig[] {
  const [configs, setConfigs] = useState<HouseholdWebhookConfig[]>([])

  useEffect(() => {
    if (!uid) return
    const r = ref(db, `userPrefs/${uid}/webhookConfigs`)
    return onValue(r, snap => {
      const data = snap.val() as Record<string, WebhookConfig> | null
      if (!data) { setConfigs([]); return }
      setConfigs(
        Object.entries(data).map(([householdId, cfg]) => ({
          ...cfg,
          householdId,
        }))
      )
    })
  }, [uid])

  return configs
}
