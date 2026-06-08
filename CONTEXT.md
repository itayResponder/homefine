# HomeFine — Project Context

## What is this?
Multi-household finance manager SPA. React 19 + TypeScript + Vite + Firebase Realtime Database (not Firestore).

## Firebase Project
- Project ID: homefine-a7613 (check .env for current)
- Hosting: homefine-a7613.web.app — Realtime DB: europe-west1

## Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LandingPage | Marketing page |
| `/dashboard` | DashboardPage | Household list, create/join |
| `/join/:householdId` | JoinPage | Sends join request (owner must approve) |
| `/app/:householdId` | HouseholdLayout → AppPage | Finance app (כספים) |
| `/app/:householdId/home` | HouseholdLayout → HouseholdPage | Tasks + shopping (ניהול משק בית) |
| `/app/:householdId/calendar` | HouseholdLayout → CalendarPage | Shared household calendar (יומן משותף) |

## What's Built
- ✅ Multi-household support with invite links + owner approval flow
- ✅ Real-time sync (Firebase onValue listeners)
- ✅ Hebrew (RTL) + English (LTR) i18n
- ✅ Per-user color theming
- ✅ Dynamic per-household categories — add/edit/delete via Settings modal; seeded from 20 defaults on first load; emoji picker (curated ~70 emojis grouped by theme)
  - `automation` (⚡, order 19) added as default — used automatically for Google Wallet webhook transactions
  - `electricity` icon changed from ⚡ to 💡
  - `useCategories` auto-patches existing households: adds `automation` if missing, fixes electricity icon if still ⚡
  - Legacy `categoryNames`/`categoryOptions` removed from i18n files (were unused)
- ✅ Recurring charges (auto-apply monthly)
- ✅ Audit logs with diff tracking
- ✅ Online presence tracking (green/gray dots in AppHeader)
- ✅ Owner controls: rename, expenses-only mode, participant management
- ✅ Income privacy per member (client-side filter)
- ✅ Join request flow: JoinPage collects nameHe/nameEn → bell notification → approve auto-creates member card
- ✅ Bilingual member names (he + en); created on household creation + join approval
- ✅ Delete member (cascades) + Leave household + Delete household
- ✅ Membership guard (redirects if removed mid-session)
- ✅ Create household modal (DashboardPage, side-by-side name fields)
- ✅ AddMemberModal via pills ＋ button — custom validation (no browser popup): required fields, Hebrew/English character-set enforcement, duplicate name check; red border + field-error message
- ✅ TransactionView — unified expense/income form+list (replaces separate ExpensesView/IncomeView); custom validation on desc (required), amount (>0), category (required); red border + field-error messages
- ✅ Landing page with locale-aware screenshots
- ✅ Home module: Kanban tasks (dnd-kit, 3 columns: לבצע/בתהליך/בוצע) + shopping list
- ✅ Settings + Logs modals (scrollable ap-modal-body pattern)
- ✅ Shared calendar: monthly grid, multi-day events, participants tagging, recurring, EventModal (create/edit/delete)

## Automation — Google Wallet → HomeFine
- ✅ Cloudflare Worker webhook (`worker/`) — receives Google Wallet push notifications via MacroDroid and writes transactions to Firebase
- ✅ Parser (`worker/src/parser.ts`) — parses Google Wallet notification format: title `"MERCHANT  D/M/YY"` + body `"₪amount with CardName ••1289"`
- ✅ `webhookKeys/{apiKey}` Firebase path — reverse lookup (uid, householdId, memberId). No client-read.
- ✅ `userPrefs/{uid}/webhookConfigs/{householdId}` — **per-household** config (apiKey, householdId, memberId, lastPingedAt)
- ✅ Automation UI in SettingsView — connection status (🟢/⚪), `.mdr` download, test button, subtle "כבה אוטומציה" link. No URL/key display (baked into .mdr). Android only.
- ✅ "לוג רכישות" in ⚙️ dropdown menu (AppHeader) — WebhookLogModal with two tabs: הצליחו (ok) / כשלו (parse_failed). Delete individual entries or clear tab. Rendered from HouseholdLayout.
- ✅ Webhook transactions appear in Logs modal with `who: '⚡ אוטומציה'` — log write is awaited in Worker (fire-and-forget was silently dropped).
- ✅ `.mdr` download — generates a **single** MacroDroid macro with one trigger + one HTTP action per configured household. Fetches all `userPrefs/{uid}/webhookConfigs` at download time — no matter which household you download from, you always get the complete multi-household macro (`HomeFine_Wallet.mdr`). Re-import replaces the old macro.
- ✅ `lastPingedAt` — worker writes timestamp on every valid request; UI shows 🟢/⚪ connection status
- ✅ Test Connection button — sends ₪1 test transaction from within the app
- ✅ `VITE_WEBHOOK_URL` — `https://homefine-webhook.homefine.workers.dev`
- ✅ `webhookDebug` Firebase path — worker writes to this path on every authenticated request. Status values: `parse_failed` (422), `ok` + transactionId + logStatus (success). Check here after any purchase to see exactly what happened.
- ✅ Log write is **awaited** in the Worker (not fire-and-forget) — fire-and-forget was not guaranteed to complete in Cloudflare Workers. Log entries appear in the Logs modal with `who: '⚡ אוטומציה'`.
- ✅ Parser regex — accepts any non-digit separator before card last-4 (handles both `••` and `..` and other variants)
- ✅ MacroDroid variable format — must use `{not_title}` and `{notification}` (inserted via `...` button), NOT `%%ntitle%%`/`%%ntbody%%` (those are not substituted in HTTP body)

### Deploying the Worker
```bash
cd worker
npm install
wrangler login                               # one-time
wrangler secret put FIREBASE_CLIENT_EMAIL    # from service account JSON
wrangler secret put FIREBASE_PRIVATE_KEY     # from service account JSON
wrangler deploy
# → note the deployed URL, set it as VITE_WEBHOOK_URL in .env
```
Service account: Firebase Console → Project Settings → Service Accounts → Generate new private key

### Future migration to Firebase Blaze
All the Firebase Functions code is already written in `functions/` — it's a drop-in replacement.
Steps when ready:
1. Upgrade Firebase project to Blaze plan (pay-as-you-go, free tier covers personal use)
2. `firebase deploy --only functions`
3. Update `VITE_WEBHOOK_URL` in `.env` to `https://europe-west1-homefine-a7613.cloudfunctions.net/smsWebhook`
4. Rebuild + redeploy frontend
5. Can delete `worker/` after confirming

## Component Structure (post-refactor)

```
src/
├── components/
│   ├── app/
│   │   ├── finance/          ← HeroCard, SummaryView, TransactionView, MemberView, TxEntry, TransactionList
│   │   ├── recurring/        ← RecurringSection
│   │   ├── settings/         ← 9 sub-components: AutomationSection, CategoryManager, ColorThemeSection,
│   │   │                        EditMemberModal, ExportSection, IncomePrivacySection, MembersSection,
│   │   │                        OwnerSettingsSection, ParticipantsSection, WebhookLogModal
│   │   ├── AppHeader, AppNav, AddMemberModal, AddTransactionModal
│   │   ├── EditTransactionModal, LogsSection, SettingsView, SyncOnlineBar
│   ├── calendar/             ← CalendarDay, CalendarGrid, CalendarHeader, EventModal
│   ├── home/                 ← HomeView, tasks/*, shopping/*
│   └── ui/                   ← AmountInput, CustomDatePicker, CustomSelect, EmojiPicker,
│                                LanguageToggle, Money, NotificationPanel
├── firebase/
│   ├── db.ts                 ← barrel re-export (backwards compat)
│   ├── households.ts, members.ts, transactions.ts, presence.ts, webhooks.ts
│   ├── calendarDb.ts, homeDb.ts, config.ts
├── hooks/
│   ├── useRecurringAutoApply ← debounced auto-apply logic (extracted from AppPage)
│   ├── useClickOutside       ← shared outside-click handler
│   ├── useWebhookAutomation  ← webhook download/test/keygen logic
│   └── ... (useAuth, useMembers, usePresence, useTransactions, useRecurring, useLogs,
│            useCategories, useHouseholdMeta, useHouseholds, useJoinRequests,
│            useMemberName, useSyncStatus, useUserColor, useShoppingList, useTasks,
│            useCalendarEvents)
├── i18n/                     ← he.ts, en.ts, types.ts, context.tsx (all strings here, no inline i18n)
├── types/
│   ├── index.ts              ← all main types incl. PresenceRecord (moved from firebase/)
│   └── home.ts               ← home/tasks types
├── utils/
│   ├── macroDroid.ts         ← MacroDroid file generator (extracted from SettingsView)
│   ├── members.ts            ← getDefaultMemberId (shared across 3 components)
│   └── categories.ts, color.ts, date.ts, format.ts, recurring.ts, taskUrgency.ts
└── pages/                    ← AppPage, HouseholdLayout, DashboardPage, LandingPage, JoinPage,
                                 CalendarPage, HouseholdPage
```

## CSS Design System
- **Global variables** (`src/index.css`): `--brand` (#2563EB), `--clr-dark` (#1a1a2e), `--clr-purple` (#9490CC)
- **Per-user theme** (`buildColorVars`): `--ac`, `--acd`, `--acl`, `--ib`, `--ibg`, `--bg`
- **Logo colors**: `Home` = #0F172A, `Fine` = #2563EB — always hardcoded, never `var(--ac)`
- Shared design-system classes live in `AppPage.css`; component-specific CSS in per-component files
- `SettingsView.module.css` — CSS Modules for settings sub-components

## What's Planned / Not Yet Built
- ❌ Super Admin panel
- ❌ Viewer role (read-only member)
- ❌ Server-side income privacy
