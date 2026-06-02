# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Start — Always Do This First
At the start of every conversation, read `CONTEXT.md` to get the current project state before starting any work.

## Auto-Update Rule
After completing any feature or significant change — without waiting to be asked — automatically:
1. Update `CONTEXT.md` (add to "What's Built", fix outdated descriptions)
2. Update `CLAUDE.md` if routing, architecture patterns, or data flow changed
3. Update the relevant memory files in `C:\Users\itay\.claude\projects\d--Itay-Projects-Itay-Projects-homefine\memory\`
4. Update `MEMORY.md` index if a new memory file was added

## Commands

```bash
npm run dev        # start Vite dev server
npm run build      # tsc type-check + Vite production build
npm run lint       # ESLint
firebase deploy --only hosting          # deploy frontend (after build)
firebase deploy --only database         # deploy Security Rules only
firebase deploy --only hosting,database # deploy both
npx tsc --noEmit   # TypeScript type-check only
```

## Architecture

### Stack
React 19 + TypeScript + Vite, Firebase Realtime Database (not Firestore), Firebase Auth (Google OAuth), React Router v7, deployed to Firebase Hosting.

### Routing
Routes in `App.tsx`:
- `/` → `LandingPage` (public)
- `/dashboard` → `DashboardPage` (auth-gated, household list)
- `/join/:householdId` → `JoinPage` (sends join request, not direct join)
- `/app/:householdId` → `HouseholdLayout` (auth-gated, nested layout)
  - index → `AppPage` (כספים — finance views)
  - `home` → `HouseholdPage` (ניהול משק בית — tasks + shopping)

**Layout Route pattern:** `HouseholdLayout.tsx` is a React Router v7 nested layout. It renders `AppHeader` once and holds all shared hooks. Switching between tabs never remounts AppHeader or re-runs shared hooks. Child pages access shared state via `useHouseholdContext()` = `useOutletContext<HouseholdContextType>()` (exported from `HouseholdLayout.tsx`). `HouseholdContextType` carries: `householdId`, `user`, `members`, `membersReady`, `online`, `isOwner`, `expensesOnly`, `meta`, `primaryColor`, `updateColor`, `joinRequests`, `openModal`/`setOpenModal`, `updateSettings`, `renameMeta`, `toggleMemberIncome`, `addMember`, `removeMember`.

### Data Flow
All data is scoped to a `householdId`. Shared hooks (useMembers, usePresence, useUserColor, useHouseholdMeta, useJoinRequests) live in `HouseholdLayout`. Finance-specific hooks (useTransactions, useRecurring, useLogs) live in `AppPage`. Every hook takes `householdId` as first arg, opens a Firebase `onValue` listener, and exposes `ready: boolean`. `AppPage` waits for `membersReady + txReady + recurringReady` before rendering content.

Firebase path structure:
```
households/{householdId}/
  meta/             ← HouseholdMeta (name, ownerId, settings) — publicly readable, owner-write
  members/          ← Member[]
  transactions/     ← Transaction[]
  recurringCharges/ ← RecurringCharge[]
  logs/             ← LogEntry[]
  presence/         ← {uid: {name, photoURL?, ts, online: boolean}} — persistent per-member
  joinRequests/     ← {uid: {name, email, photoURL, ts}} — owner-read, self-write
  participants/     ← {uid: {name, email, photoURL, joinedAt}} — owner only
userHouseholds/{uid}/{householdId} ← true
userPrefs/{uid}/primaryColor ← hex string
```

**Presence behavior:** record is created on first connect, persists until user leaves/is removed from household. `online: true` on connect, `online: false` on disconnect (via `onDisconnect().update`) or React unmount. `leaveHousehold` and `removeParticipant` both call `remove(presence/{uid})`. AppHeader shows all household users with green dot (online) or gray dot (offline).

### Authentication & Security
`useAuth.ts` uses `onAuthStateChanged` — **no whitelist**. Any Google account can log in. Access control is enforced server-side via Firebase Security Rules (`database.rules.json`):
- `households/{id}/meta` — publicly readable (needed for JoinPage before login)
- All other household data — readable/writable only by approved members (`userHouseholds/{uid}/{id} = true`)
- `joinRequests` — owner-read; any authenticated user can write their own request
- `participants` — owner only
- `userHouseholds/{uid}/{id}` — owner can write (approve/remove); user can delete their own (leave)

`document.documentElement.dir` and `lang` are set reactively by `I18nProvider`.

### Household Permissions
- `HouseholdMeta.ownerId` → the owner/admin
- `useHouseholdMeta(householdId, uid)` → returns `{ meta, isOwner, expensesOnly, updateSettings, renameMeta, toggleMemberIncome }`
- Owner sees extra controls in SettingsView: rename, expenses-only toggle, **גישה לבית** (participant list with revoke access)
- `Member.privateIncome?: boolean` → filtered client-side in SummaryView, HeroCard, MemberView — all receive `currentUserId` and exclude private income of other members
- `Member.userId?: string` → links member card to a user account
- Participants (`households/{id}/participants/{uid}`) — each member seeds their own entry on AppPage load (`seedParticipant` idempotent); owner also seeds on load; removed via `removeParticipant` (also removes `userHouseholds` entry). Security Rules: member can write own entry if `userHouseholds/{uid}/{id}` exists; owner can write any entry.

### Join Request Flow
- Sharing: copy `/join/:householdId` URL
- JoinPage creates `joinRequests/{uid}` in Firebase (does NOT auto-join)
- Owner sees bell 🔔 in AppHeader (only if isOwner) with badge count
- Approve: adds to `userHouseholds/{uid}/{householdId}` + removes request
- Deny: removes request
- Shared component: `src/components/ui/NotificationPanel.tsx`

### Per-User Color Theming
`useUserColor(uid)` syncs with `userPrefs/{uid}/primaryColor`. `buildColorVars(hex)` derives CSS variables (`--ac`, `--acd`, `--acl`, `--ib`, `--ibg`, `--bg`). Applied as inline `style` on `.ap-root` and `.db-root`.

### Currency Formatting
Always use `<Money amount={n} sign="−" />` for JSX, or `formatCurrency(n, dir, sign)` for string contexts. Format: `−1,000 ₪`.

### Categories
`TransactionCategory` has 19 values: rent, electricity, water, gas, internet, mobile, property_tax, food, entertainment, health, clothing, transport, education, baby, loan, salary, bills, nela, other. Icons in `src/constants/categories.ts`.

### Recurring Charges
`RecurringCharge` stores `startYearMonth` (YYYY-MM), `monthCount`, `dayOfMonth`. `applyRecurring` in `src/utils/recurring.ts` is called via debounced `useEffect` (600ms) in `AppPage`.

### Navigation (AppNav pills)
Pills order: סיכום → הוצאות → [הכנסות if !expensesOnly] → [member pills with × to delete] → ＋ → חיובים קבועים. Logs and Settings are opened via modals from AppHeader (not pills). Member pills dynamically generated from `members[]`. Clicking × triggers `handleRemoveMember` (deletes member + all their transactions/recurring). Clicking ＋ opens `AddMemberModal`.

### Member Name Localization
`useMemberName()` hook returns a function `(member) => string` — uses `member.nameEn` when locale is English, `member.name` (Hebrew) otherwise. Members have both `name` (Hebrew) and optional `nameEn` (English) fields.

### Shared UI Components
- `src/components/ui/CustomSelect.tsx` — styled dropdown (cs-* classes)
- `src/components/ui/CustomDatePicker.tsx` — styled calendar (cd-* classes)
- `src/components/ui/Money.tsx` — currency display
- `src/components/ui/NotificationPanel.tsx` — join request panel + BellSVG export
- `src/components/app/AddMemberModal.tsx` — modal for adding a member (name HE + EN), opened via AppNav ＋ pill

### CSS Conventions
- All shared design-system classes in `src/pages/AppPage.css` (`.ap-root`, `.wrap`, `.hero`, `.pills`, `.pill`, `.fcard`, `.inp`, `.sbtn`, etc.)
- Use `inset-inline-end` / `inset-inline-start` for RTL/LTR positioning
- Per-component CSS files for component-specific styles
- Do NOT use Tailwind or CSS modules

### CSS Consistency Rule
Before adding new CSS, check if a class already exists in AppPage.css or NotificationPanel.css. Never duplicate visual styles between Dashboard and App — use shared components.
