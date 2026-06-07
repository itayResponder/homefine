import { parseWalletNotification } from './parser'

export interface Env {
  FIREBASE_DB_URL: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PRIVATE_KEY: string
}

interface WebhookKey {
  uid: string
  householdId: string
  memberId: string
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() })
    if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

    let body: { title?: string; body?: string; apiKey?: string; isTest?: boolean }
    try {
      body = await req.json()
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400)
    }

    const { title, body: notifBody, apiKey, isTest } = body
    if (!apiKey) return json({ ok: false, error: 'Missing apiKey' }, 400)
    if (!title || !notifBody) return json({ ok: false, error: 'Missing title or body' }, 400)

    // ── Firebase auth ─────────────────────────────────────────────────────────
    let token: string
    try {
      token = await getFirebaseToken(env)
    } catch {
      return json({ ok: false, error: 'Firebase auth failed' }, 500)
    }

    // ── Authenticate webhook key ──────────────────────────────────────────────
    const keyResp = await fetch(`${env.FIREBASE_DB_URL}/webhookKeys/${apiKey}.json`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const keyData = (await keyResp.json()) as WebhookKey | null
    if (!keyData?.uid) return json({ ok: false, error: 'Invalid API key' }, 401)

    const { uid, householdId, memberId } = keyData

    // ── Update lastPingedAt only for real MacroDroid pings ────────────────────
    if (!isTest) {
      fetch(`${env.FIREBASE_DB_URL}/userPrefs/${uid}/webhookConfigs/${householdId}.json`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPingedAt: Date.now() }),
      })
    }

    // ── Parse notification ────────────────────────────────────────────────────
    const parsed = parseWalletNotification(title, notifBody)
    if (!parsed) {
      // Write raw data to Firebase so it's visible for debugging
      fetch(`${env.FIREBASE_DB_URL}/households/${householdId}/webhookDebug.json`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: notifBody, ts: Date.now(), error: 'parse_failed' }),
      })
      return json({ ok: false, error: 'Could not parse notification', raw: { title, body: notifBody } }, 422)
    }

    // ── Write transaction ─────────────────────────────────────────────────────
    const now = Date.now()
    const txResp = await fetch(`${env.FIREBASE_DB_URL}/households/${householdId}/transactions.json`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'expense',
        amount: parsed.amount,
        description: parsed.merchant,
        category: 'other',
        memberId,
        date: parsed.date,
        createdAt: now,
        source: 'wallet',
        cardLastFour: parsed.cardLastFour,
      }),
    })
    if (!txResp.ok) return json({ ok: false, error: 'DB write failed' }, 500)
    const { name: transactionId } = (await txResp.json()) as { name: string }

    // ── Write log (fire and forget) ───────────────────────────────────────────
    fetch(`${env.FIREBASE_DB_URL}/households/${householdId}/logs.json`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        entityType: 'transaction',
        who: uid,
        ts: now,
        description: parsed.merchant,
        amount: parsed.amount,
        memberId,
        txType: 'expense',
        source: 'webhook',
      }),
    })

    return json({ ok: true, transactionId })
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

async function getFirebaseToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(
    JSON.stringify({
      iss: env.FIREBASE_CLIENT_EMAIL,
      sub: env.FIREBASE_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope:
        'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    }),
  )

  const signingInput = `${header}.${payload}`
  const key = await importPrivateKey(env.FIREBASE_PRIVATE_KEY)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))

  const jwt = `${signingInput}.${b64url(sig)}`

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = (await resp.json()) as { access_token?: string; error?: string }
  if (!data.access_token) throw new Error(data.error ?? 'No access token')
  return data.access_token
}

function b64url(data: string | ArrayBuffer): string {
  let str: string
  if (typeof data === 'string') {
    str = btoa(unescape(encodeURIComponent(data)))
  } else {
    const bytes = new Uint8Array(data)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    str = btoa(binary)
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/"/g, '')
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const binary = atob(pemBody)
  const der = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i)

  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}
