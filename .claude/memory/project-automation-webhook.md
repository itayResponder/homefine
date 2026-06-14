---
name: project-automation-webhook
description: "Google Wallet → HomeFine automation: Render Backend webhook, Automate (LlamaLab) .flo flow, setup and debugging"
metadata: 
  node_type: memory
  type: project
  originSessionId: ce781d7a-5fc4-4b1c-963e-7ccba48a3d3b
---

Webhook automation is built and fully working. Google Wallet push notifications → Automate (LlamaLab) → HomeFine Backend (Render) → Firebase Realtime DB.

**Why:** User wants automatic transaction entry from Google Wallet. Backend runs on Render (`homefine-backend.onrender.com`), replacing the old Cloudflare Worker.

**Architecture:**
- Backend at `https://homefine-backend.onrender.com/api/webhook` — receives POST, parses Google Wallet notification, writes transaction to Firebase
- `src/utils/automateFlow.ts` — `generateAutomateFlow(apiKey, webhookUrl): string` generates Automate (LlamaLab) JSON flow file (`.flo`)
- `src/hooks/useWebhookAutomation.ts` — `handleDownloadFlow` downloads `HomeFine_Wallet.flo` (mime: `application/json`)
- `VITE_WEBHOOK_URL` in `.env` — `https://homefine-backend.onrender.com/api/webhook`

**DB paths:**
- `webhookKeys/{apiKey}: { uid, householdId, memberId }` — reverse lookup for auth
- `userPrefs/{uid}/webhookConfigs/{householdId}: { apiKey, householdId, memberId, lastPingedAt? }` — per-household config
- `households/{id}/webhookDebug/{pushId}: { title, body, ts, error }` — written by backend on parse failure; owner-readable

**Automate (LlamaLab) setup — via download button:**
- App Settings → "הורד Flow" → downloads `HomeFine_Wallet.flo`
- Automate → Import → select the .flo file → everything is pre-configured
- Flow: NotificationPosted (Google Wallet package) → HttpRequest POST to webhook with apiKey + notification title/body

**Automation UI features (SettingsView):**
- Connection status: 🟢 "מחובר — פעיל לאחרונה DD/MM/YY HH:MM" or ⚪ "טרם חובר"
- "הורד Flow" → downloads `HomeFine_Wallet.flo` for the current household
- "בדוק חיבור" → sends ₪1 test transaction (isTest:true, does NOT update lastPingedAt); shows ✅/❌
- "כבה אוטומציה" — subtle underline link at bottom, deletes config from Firebase
- **Android only** — iOS has no notification interception equivalent

**Parser details (backend):**
- Body regex: `/[₪﹩]?\s*([\d,]+\.?\d*)\s+with\s+(.+?)\s+[^\d\s]{1,4}(\d{4})/i`
- Accepts any non-digit separator before card last-4 (handles `••`, `..`, or other variants)
- Title: splits on 2+ spaces; first part = merchant, second = date (D/M/YY) or time (falls back to today)

**Debugging — webhookDebug path:**
- Backend writes to `households/{id}/webhookDebug/` on every authenticated request
- Status values: `parse_failed` (422) | `ok` + transactionId (success)
- If nothing appears in webhookDebug → Automate didn't fire OR apiKey invalid

**Debug checklist after a purchase:**
1. Automate flow log → did flow fire? what response code?
2. Firebase → `webhookDebug` → `status: parse_failed/ok`? + `logStatus`
3. Firebase → `transactions` → was transaction written?
4. App → Logs modal → "⚡ אוטומציה" entry should appear

**Migration history:**
- Previously used Cloudflare Worker (`homefine-webhook.homefine.workers.dev`) + MacroDroid (`.mdr` file)
- Migrated 2026-06-14 to Render Backend + Automate (LlamaLab) (`.flo` file)

**How to apply:** When user asks about webhook/automation, refer to Render Backend + Automate. The old Worker/MacroDroid references are obsolete.
