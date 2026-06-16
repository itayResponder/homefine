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
- ✅ Hebrew (RTL) + English (LTR) i18n — all strings via i18n; no inline hardcoded text in components
  - i18n keys (סבב 6): `joinRequestsTitle`, `noPendingRequests`, `householdNamePlaceholder`, `emojiSearchPlaceholder`, `checkItem`, `uncheckItem`, `deleteItem`
  - i18n key added: `categorySearchPlaceholder` (CategorySelect search field)
  - `NotificationPanel` uses `useI18n()` internally — no `isRtl` prop
  - Inline styles converted to CSS classes: `App.css` (loading state), `AppPage.css` (`.ap-modal--member-edit`, `.money`, `.ap-member-fields--modal`)
- ✅ Per-household color theming — `useUserColor(uid, householdId)` reads from `userPrefs/{uid}/householdColors/{householdId}`; dashboard (no householdId) falls back to global `primaryColor`. `updateColor` only updates the specific household's `member.color` (not all households). Firebase helpers: `setHouseholdColor`, `subscribeHouseholdColor` in `households.ts`.
- ✅ `ColorPicker` (`src/components/ui/ColorPicker.tsx`) — uses `react-colorful` (`HexColorPicker` + `HexColorInput`); renders inline in `ColorThemeSection`. CSS Modules via `ColorPicker.module.css`. Replaces the old custom swatch+dropdown implementation.
- ✅ Dashboard always uses `DEFAULT_COLOR` (#2563EB) — `DashboardPage` no longer calls `useUserColor`; passes `DEFAULT_COLOR` directly to `buildColorVars`. Color theming is per-household only.
- ✅ Dynamic per-household categories — add/edit/delete via Settings modal; seeded from 20 defaults on first load; emoji picker (curated ~70 emojis grouped by theme)
  - `automation` (⚡, order 19) added as default — used automatically for Google Wallet webhook transactions
  - `electricity` icon changed from ⚡ to 💡
  - `useCategories` auto-patches existing households: adds `automation` if missing, fixes electricity icon if still ⚡
  - Legacy `categoryNames`/`categoryOptions` removed from i18n files (were unused)
- ✅ `CategorySelect` — unified category picker used in TransactionView, EditTransactionModal, RecurringSection
  - bottom sheet on mobile, centered modal on desktop
  - search (Hebrew + English), grid of icons; add/edit uses **2-step wizard** (no floating EmojiPicker)
  - Wizard step 1: inline `EmojiPicker` fills full modal height + "הבא" / ביטול footer
  - Wizard step 2: large icon preview (click → back to step 1), Hebrew name, English name, Save/Cancel/Delete
  - Add mode starts at step 1; Edit mode starts at step 2 (icon already set)
  - trigger button styled identically to `CustomSelect` (uses `--ib`, `--ibg`, `--clr-dark`, `--rs`, `--clr-purple`)
  - X button in modal corner (always visible); backdrop click also closes
  - `error?: boolean` prop — same validation UX as CustomSelect
  - `onUpdateCategory?` / `onDeleteCategory?` — edit ✏️ button on each grid item (hover on desktop, always on mobile); delete 🗑️ in edit form; if deleted category was selected, clears selection
  - `defaultOpen` / `defaultMode` / `defaultEditId` / `onClose` props — management mode (no trigger rendered, modal opens immediately); used by CategoryManager
  - `EmojiPicker` supports `inline?: boolean` prop — when inline, renders without portal/backdrop/positioning; clicking an emoji calls `onChange` only (no auto-close)
- ✅ `CategoryManager` (settings) — rewritten to use `CategorySelect` for full UI consistency
  - inline grid using `csel-*` classes (same visual as picker modal)
  - click category / ✏️ → opens CategorySelect in edit mode; "+ הוסף קטגוריה" → opens in add mode
  - old chip-list + inline form removed
- ✅ EmojiPicker search fix — groups now have `labelEn`; search filters by Hebrew `label` OR English `labelEn`
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
- ✅ `TransactionList` — requires `members: Member[]` prop; `TransactionItem` shows per-member color chip (same style as TxEntry `wtag`) in the sub-line alongside category + date
- ✅ `formatCurrency` — preserves decimal places for non-integer amounts (e.g. `1,000.50 ₪`); integers still render without decimals
- ✅ Landing page with locale-aware screenshots
- ✅ Home module: Kanban tasks (dnd-kit, 3 columns: לבצע/בתהליך/בוצע) + shopping list
- ✅ Settings + Logs modals (scrollable ap-modal-body pattern)
- ✅ Shared calendar: monthly grid, multi-day events, participants tagging, recurring, EventModal (create/edit/delete)

## Automation — Google Wallet → HomeFine
- ✅ Backend webhook (`https://homefine-backend.onrender.com/api/webhook`) — receives Google Wallet push notifications via Automate (LlamaLab) and writes transactions to Firebase
- ✅ `webhookKeys/{apiKey}` Firebase path — reverse lookup (uid, householdId, memberId). No client-read.
- ✅ `userPrefs/{uid}/webhookConfigs/{householdId}` — **per-household** config (apiKey, householdId, memberId, lastPingedAt)
- ✅ Automation UI in SettingsView — connection status (🟢/⚪), "📥 הורד Flow" button, "בדוק חיבור" test button, subtle "כבה אוטומציה" link. Android only. URL + Body copy-paste section removed (superseded by .flo download).
- ✅ "לוג רכישות" in ⚙️ dropdown menu (AppHeader) — WebhookLogModal with two tabs: הצליחו (ok) / כשלו (parse_failed). Delete individual entries or clear tab. Rendered from HouseholdLayout.
- ✅ Webhook transactions appear in Logs modal with `who: '⚡ אוטומציה'`
- ✅ `.flo` binary download — "📥 הורד Flow לAutomate" button in AutomationSection generates `HomeFine_Wallet.flo` (Automate binary format, reverse-engineered). `src/utils/automateFlow.ts` — `generateAutomateFlowBinary(configs, webhookUrl)`: HEADER (23 bytes) + [requestBlock per config] + FOOTER. Each requestBlock: 22-byte pre-URL block (`de 13 08 00 ...`) + URL + POST method + Content-Type + 6 body fields. `src/hooks/useAllWebhookConfigs.ts` — listens to `userPrefs/{uid}/webhookConfigs`, returns all configs across all households. Button appears only when webhookConfig is active.
- ✅ `lastPingedAt` — backend writes timestamp on every valid request; UI shows 🟢/⚪ connection status
- ✅ Test Connection button — sends ₪1 test transaction from within the app
- ✅ `VITE_WEBHOOK_URL` — `https://homefine-backend.onrender.com/api/webhook`
- ✅ `webhookDebug` Firebase path — backend writes to this path on every authenticated request. Status values: `parse_failed` (422), `ok` + transactionId + logStatus (success). Check here after any purchase to see exactly what happened.

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
│   │   ├── AppHeader, AppNav, AddMemberModal
│   │   ├── EditTransactionModal, LogsSection, SettingsView, SyncOnlineBar
│   ├── calendar/             ← CalendarDay, CalendarGrid, CalendarHeader, EventModal
│   ├── home/                 ← HomeView, tasks/*, shopping/*
│   └── ui/                   ← AmountInput, CategorySelect, CustomDatePicker, CustomSelect,
│                                EmojiPicker, LanguageToggle, Money, NotificationPanel
├── firebase/
│   ├── db.ts                 ← barrel re-export (backwards compat)
│   ├── households.ts, members.ts, transactions.ts, presence.ts, webhooks.ts
│   ├── calendarDb.ts, homeDb.ts, config.ts
├── hooks/
│   ├── useRecurringAutoApply ← debounced auto-apply logic (extracted from AppPage)
│   ├── useClickOutside       ← shared outside-click handler
│   ├── useWebhookAutomation  ← webhook download/test/keygen logic (+ handleDownloadFlow)
│   ├── useAllWebhookConfigs  ← all webhook configs for a user (all households)
│   └── ... (useAuth, useMembers, usePresence, useTransactions, useRecurring, useLogs,
│            useCategories, useHouseholdMeta, useHouseholds, useJoinRequests,
│            useMemberName, useSyncStatus, useUserColor, useShoppingList, useTasks,
│            useCalendarEvents)
├── i18n/                     ← he.ts, en.ts, types.ts, context.tsx (all strings here, no inline i18n)
│   │                            includes: dashboard keys, removeMember/removeParticipant, colorTheme (settings.*),
│   │                            purchaseLog, leaveHouseholdBtn/Title/Sub (AppHeader + HouseholdLayout),
│   │                            automationLog/webhookSucceeded/Failed/NoEntries/ClearAll (WebhookLogModal),
│   │                            categoryNewTitle/EditTitle, editBtn, monthCountLabel/Placeholder,
│   │                            recurringDayLabel (function)
├── types/
│   ├── index.ts              ← all main types incl. PresenceRecord (moved from firebase/)
│   └── home.ts               ← home/tasks types
├── utils/
│   ├── automateFlow.ts       ← Automate (LlamaLab) .flo file generator
│   ├── members.ts            ← getDefaultMemberId (shared across 3 components)
│   ├── transactions.ts       ← computeDiffs (extracted from AppPage)
│   └── categories.ts, color.ts (nameToColor + buildColorVars), date.ts, format.ts, recurring.ts, taskUrgency.ts
└── pages/                    ← AppPage, HouseholdLayout, DashboardPage, LandingPage, JoinPage,
                                 CalendarPage, HouseholdPage
```

## CSS Design System
- **Global variables** (`src/index.css`): `--brand` (#2563EB), `--clr-dark` (#1a1a2e), `--clr-purple` (#9490CC)
- **Per-user theme** (`buildColorVars`): `--ac`, `--acd`, `--acl`, `--ib`, `--ibg`, `--bg`
- **Logo colors**: `Home` = #0F172A, `Fine` = #2563EB — always hardcoded, never `var(--ac)`
- Shared design-system classes live in `AppPage.css`; component-specific CSS in per-component files
- `SettingsView.module.css` — CSS Modules for settings sub-components

## AI Chat Widget
- ✅ Floating chat widget (`ChatWidget`) — FAB button, sliding panel, streaming SSE responses
- ✅ `src/services/api.ts` — only file that knows `VITE_API_URL`; handles Firebase token + fetch + SSE parsing → `ReadableStream<ChatStreamEvent>`
- ✅ `src/hooks/useChat.ts` — chat state (messages, streaming, error); calls `chatStream`, appends tokens to assistant bubble in real time
- ✅ `src/components/app/ChatWidget.tsx` — self-contained floating UI; no prop drilling; uses `useChat` + `useI18n`; RTL-aware
- ✅ `src/components/app/ChatWidget.module.css` — CSS Modules; uses `var(--clr-dark)` / `var(--clr-purple)`; mobile responsive
- ✅ `VITE_API_URL=https://homefine-backend.onrender.com` in `.env`
- Backend endpoint: `POST /api/chat/stream` — request: `{ messages, householdId, lang }` + `Authorization: Bearer <token>`
- **Integration:** add `<ChatWidget householdId={householdId} />` anywhere `householdId` is available (e.g. `HouseholdLayout.tsx`)

## What's Planned / Not Yet Built
- ❌ Super Admin panel
- ❌ Viewer role (read-only member)
- ❌ Server-side income privacy
