import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { parseWalletNotification } from './parser'

initializeApp()

interface WebhookKey {
  uid: string
  householdId: string
  memberId: string
}

export const smsWebhook = onRequest(
  { region: 'europe-west1', cors: false },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' })
      return
    }

    const { title, body, apiKey } = req.body ?? {}

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing apiKey' })
      return
    }
    if (!title || !body) {
      res.status(400).json({ ok: false, error: 'Missing title or body' })
      return
    }

    const db = getDatabase()

    // ── Authenticate via API key ──────────────────────────────────────────────
    const keySnap = await db.ref(`webhookKeys/${apiKey}`).get()
    if (!keySnap.exists()) {
      res.status(401).json({ ok: false, error: 'Invalid API key' })
      return
    }
    const { uid, householdId, memberId } = keySnap.val() as WebhookKey

    // ── Parse notification ────────────────────────────────────────────────────
    const parsed = parseWalletNotification(String(title), String(body))
    if (!parsed) {
      res.status(422).json({ ok: false, error: 'Could not parse notification', raw: { title, body } })
      return
    }

    // ── Write transaction ─────────────────────────────────────────────────────
    const txRef = db.ref(`households/${householdId}/transactions`).push()
    const transaction = {
      id: txRef.key,
      type: 'expense',
      amount: parsed.amount,
      description: parsed.merchant,
      category: 'other',
      memberId,
      date: parsed.date,
      createdAt: Date.now(),
      source: 'wallet',
      cardLastFour: parsed.cardLastFour,
    }
    await txRef.set(transaction)

    // ── Log ───────────────────────────────────────────────────────────────────
    const logRef = db.ref(`households/${householdId}/logs`).push()
    await logRef.set({
      id: logRef.key,
      action: 'add',
      entityType: 'transaction',
      who: uid,
      ts: Date.now(),
      description: parsed.merchant,
      amount: parsed.amount,
      memberId,
      txType: 'expense',
      source: 'webhook',
    })

    res.status(200).json({ ok: true, transactionId: txRef.key })
  }
)
