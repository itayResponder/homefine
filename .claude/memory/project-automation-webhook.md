---
name: project-automation-webhook
description: "Google Wallet → HomeFine automation: Render Backend webhook, Automate (LlamaLab) manual setup + .flo binary download"
metadata: 
  node_type: memory
  type: project
  originSessionId: ce781d7a-5fc4-4b1c-963e-7ccba48a3d3b
---

Webhook automation is built and fully working. Google Wallet push notifications → Automate (LlamaLab) → HomeFine Backend (Render) → Firebase Realtime DB.

**Why:** User wants automatic transaction entry from Google Wallet. Backend runs on Render (`homefine-backend.onrender.com`), replacing the old Cloudflare Worker.

**Architecture:**
- Backend at `https://homefine-backend.onrender.com/api/webhook` — receives POST, parses Google Wallet notification, writes transaction to Firebase
- `src/utils/automateFlow.ts` — **RECREATED** (2026-06-15). Generates `.flo` binary (Automate proprietary format, reverse-engineered from real file). `generateAutomateFlowBinary(configs, webhookUrl): Uint8Array<ArrayBuffer>` — HEADER + [HTTP request block per config] + FOOTER. Each block has URL, POST method, Content-Type, and 6 body fields (title/body/ticker/timestamp/extras as Automate variable refs; apiKey as literal string).
- `src/hooks/useAllWebhookConfigs.ts` — listens to `userPrefs/{uid}/webhookConfigs`, returns `HouseholdWebhookConfig[]` (all households for a user)
- `src/hooks/useWebhookAutomation.ts` — exposes `handleCopyBody` + `handleCopyUrl` + `copyStatus` + `copyUrlStatus` + `handleDownloadFlow` (downloads `HomeFine_Wallet.flo`)
- `VITE_WEBHOOK_URL` in `.env` — `https://homefine-backend.onrender.com/api/webhook`

**DB paths:**
- `webhookKeys/{apiKey}: { uid, householdId, memberId }` — reverse lookup for auth
- `userPrefs/{uid}/webhookConfigs/{householdId}: { apiKey, householdId, memberId, lastPingedAt? }` — per-household config
- `households/{id}/webhookDebug/{pushId}: { title, body, ts, error }` — written by backend on parse failure; owner-readable

**Automate (LlamaLab) setup — two options (as of 2026-06-15):**
1. **📥 Download .flo** — "הורד Flow לAutomate" button downloads `HomeFine_Wallet.flo`; contains one HTTP request block per configured household. Import in Automate → File → Import.
2. **Manual copy-paste:**
- App Settings → "הגדרת Automate" section shows:
  - **URL**: webhook endpoint with 📋 copy button → paste into Automate HTTP Request block "Request URL"
  - **Body**: pre-filled JSON with `{notifTitle}`, `{notifText}`, `{notifTicker}`, `{notifTimestamp}`, `{notifExtras}` variables + baked-in `apiKey` → paste into "Request content body"
- Flow: NotificationPosted (Google Wallet package) → HttpRequest POST with the copied body

**Automation UI features (SettingsView → AutomationSection):**
- Connection status: 🟢 "מחובר — פעיל לאחרונה DD/MM/YY HH:MM" or ⚪ "טרם חובר"
- "הגדרת Automate" section: URL row + Body row, each with 📋/✅ copy button (2s feedback)
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
- Migrated 2026-06-14 to Render Backend + Automate (LlamaLab) (`.flo` download)
- Migrated 2026-06-15 to manual copy-paste setup (`.flo` binary format not importable from JSON at the time)
- 2026-06-15: Re-added `.flo` binary download after reverse-engineering the Automate proprietary format from a real file

**⚠️ Open issue (2026-06-15): Automate does not recognize the downloaded .flo file.**
- Expected magic bytes (first 4): `4c 41 46 6c` (ASCII "LAFl") — already present in HEADER constant
- Debug `console.log` added to `useWebhookAutomation.ts:handleDownloadFlow` — prints first 20 bytes before download; check DevTools console
- Blob and `URL.createObjectURL` code verified correct; root cause not yet identified

**How to apply:** When user asks about webhook/automation, refer to Render Backend + Automate. UI offers both `.flo` download AND manual copy-paste. `.flo` includes one HTTP request block per household the user has configured.
