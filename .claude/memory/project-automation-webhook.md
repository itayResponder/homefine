---
name: project-automation-webhook
description: "Google Wallet → HomeFine automation: Cloudflare Worker webhook, parser, future Blaze migration path"
metadata: 
  node_type: memory
  type: project
  originSessionId: ce781d7a-5fc4-4b1c-963e-7ccba48a3d3b
---

Webhook automation is built and ready to deploy. Google Wallet push notifications → MacroDroid → Cloudflare Worker → Firebase Realtime DB.

**Why:** User wants automatic transaction entry from Google Wallet. Chose Cloudflare over Firebase Functions to avoid Blaze plan requirement.

**Architecture:**
- `worker/` — Cloudflare Worker (TypeScript, Wrangler)
- `worker/src/index.ts` — auth + DB write via Firebase REST API + service account JWT
- `worker/src/parser.ts` — parses Google Wallet format: title `"MERCHANT  D/M/YY"`, body `"₪amount with CardName ••1289"`
- `functions/` — Firebase Functions equivalent, **kept for future Blaze migration** (do not delete)
- `database.rules.json` — `webhookKeys/` path added (no client read)
- `VITE_WEBHOOK_URL` in `.env` — fill after `wrangler deploy`

**DB paths:**
- `webhookKeys/{apiKey}: { uid, householdId, memberId }` — reverse lookup for auth
- `userPrefs/{uid}/webhookConfigs/{householdId}: { apiKey, householdId, memberId, lastPingedAt? }` — **per-household** config

**To deploy Worker:**
```bash
cd worker && npm install
wrangler login
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
wrangler deploy
# Update VITE_WEBHOOK_URL in .env → rebuild frontend
```
Service account from: Firebase Console → Project Settings → Service Accounts → Generate new private key

**Future migration to Firebase Blaze (user requested):**
1. Upgrade project to Blaze plan at console.firebase.google.com
2. `firebase deploy --only functions`
3. `VITE_WEBHOOK_URL=https://europe-west1-homefine-a7613.cloudfunctions.net/smsWebhook`
4. Rebuild + redeploy frontend (`npm run build && firebase deploy --only hosting`)
5. Delete `worker/` after confirming

**Bugs fixed during setup (important for future deploys):**
- Private key stored with literal `\n` sequences → added `.replace(/\\n/g, '\n')` in `importPrivateKey`
- Private key stored with surrounding JSON quotes `"` → added `.replace(/"/g, '')` in `importPrivateKey`
- Both fixes are now in `worker/src/index.ts`

**MacroDroid setup — via download button (recommended):**
- App Settings → "הורד קובץ הגדרה ל-MacroDroid" → downloads `HomeFine_Wallet.mdr`
- MacroDroid → Export/Import → Import → Select items to import → check macro → OK (don't check "Clear existing data")
- Each household generates its own `.mdr` file with its own API key
- Multiple imports ADD macros (don't replace) if "Clear existing data" is unchecked

**Multi-household support:**
- Each household has its own API key at `userPrefs/{uid}/webhookConfigs/{householdId}`
- Each household's Settings generates its own `.mdr` file
- User imports both files → two macros in MacroDroid → both run in parallel on every purchase

**Automation UI features (SettingsView):**
- Connection status: 🟢 "מחובר — פעיל לאחרונה DD/MM/YY HH:MM" or ⚪ "טרם חובר"
- "הורד קובץ הגדרה ל-MacroDroid" → downloads `HomeFine_{householdName}.mdr` with macro named "Google Wallet → {householdName}"
- "בדוק חיבור" → sends ₪1 test transaction; shows ✅ success or ❌ error with reason
- MacroDroid import: Export/Import → Import → Select items to import → uncheck "Clear existing data" → supports multiple households

**Current deployment status (2026-06-04) — FULLY WORKING ✅:**
- Worker at `https://homefine-webhook.homefine.workers.dev` ✅
- Per-household API keys + lastPingedAt tracking ✅
- MacroDroid .mdr download with household name ✅
- Test connection button ✅
- Multi-household support: each household has own key, own macro ✅

**How to apply:** When user asks to migrate to Blaze or deploy the webhook, follow steps above.
