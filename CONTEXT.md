# HomeFine — Project Context

## What is this?
A multi-household finance manager SPA. Users create "households", invite others via link, and track shared expenses/income. Built with React + TypeScript + Firebase Realtime Database.

## Tech Stack
- React 19 + TypeScript + Vite 8
- React Router v7 (SPA, no basename)
- Firebase: Auth (Google OAuth) + Realtime Database + Hosting
- CSS: plain per-component files, no framework
- Font: Plus Jakarta Sans

## Firebase Project
- Project ID: homefine-a7613 (check .env for current)
- Hosting: homefine-a7613.web.app
- Realtime DB: europe-west1 region

## Authentication
Any Google account can sign in. Access control is enforced server-side via Firebase Security Rules (`database.rules.json`). Household data is accessible only to approved members (`userHouseholds/{uid}/{householdId} = true`). Joining a household requires an invite link + owner approval.

## Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LandingPage | Marketing page |
| `/dashboard` | DashboardPage | Household list, create/join |
| `/join/:householdId` | JoinPage | Sends join request (owner must approve) |
| `/app/:householdId` | AppPage | Main app, all views |

## AppPage Views (pills nav)
- **סיכום** — per-member summary cards + recent transactions
- **הוצאות** — inline add form + all expenses for month
- **הכנסות** — inline add form + all income for month (hidden if expensesOnly)
- **[member name]** — per-member stats + expenses + income (X button to delete)
- **חיובים קבועים** — recurring charges management
- **לוגים** — change history (via settings gear → dropdown)
- **הגדרות** — member management, income privacy, owner controls, color theme, export

## Key Hooks
| Hook | Args | Purpose |
|------|------|---------|
| `useAuth` | — | Google login + whitelist |
| `useHouseholds` | uid | User's household list |
| `useMembers` | householdId | Members CRUD |
| `useTransactions` | householdId | Transactions CRUD |
| `useRecurring` | householdId | Recurring charges CRUD |
| `useLogs` | householdId | Audit log |
| `usePresence` | householdId, user | Online users |
| `useHouseholdMeta` | householdId, uid | Meta + isOwner + settings |
| `useJoinRequests` | ownedHouseholds[] | Join requests for owned households |
| `useMemberName` | — | Locale-aware member name display |
| `useUserColor` | uid | Per-user primary color (localStorage + Firebase) |

Participants are managed inline in AppPage (no dedicated hook) — subscribeParticipants + seedParticipant called directly.

## Permission Model
- **Owner** (`meta.ownerId === user.uid`): can rename household, toggle expenses-only mode, see join requests
- **Member**: can toggle own income privacy (`member.privateIncome`)
- **Join request flow**: JoinPage → creates request → owner approves/denies via notification bell

## Data Types (key)
```typescript
Member: { id, name, nameEn?, color, createdAt, userId?, privateIncome? }
Transaction: { id, type, amount, description, category, memberId, date, createdAt, recurringId? }
RecurringCharge: { id, description, amount, type, category, dayOfMonth, startYearMonth, monthCount, memberId, active }
HouseholdMeta: { name, ownerId, createdAt, settings?: { expensesOnly? } }
JoinRequest: { uid, name, email, photoURL?, ts, householdId, householdName }
```

## TransactionCategory (19 values)
rent, electricity, water, gas, internet, mobile, property_tax, food, entertainment, health, clothing, transport, education, baby, loan, salary, bills, nela, other

## What's Built
- ✅ Full multi-household support with invite links
- ✅ Real-time sync (Firebase onValue)
- ✅ Hebrew (RTL) + English (LTR) i18n
- ✅ Per-user color theming
- ✅ Custom styled select + date picker components
- ✅ 19 transaction categories with icons
- ✅ Recurring charges (auto-apply monthly)
- ✅ Audit logs with diff tracking
- ✅ Online presence tracking
- ✅ Owner controls (rename, expenses-only mode)
- ✅ Income privacy per member (client-side)
- ✅ Join request flow with approval/denial
- ✅ Notification bell (AppHeader + Dashboard, shared component)
- ✅ Member cards with bilingual names (he + en)
- ✅ Delete member → cascades to transactions + recurring
- ✅ Participant management — owner sees "גישה לבית" in SettingsView with photo/name/email/join date; can revoke access (removes userHouseholds + participants entry, keeps data). Each member seeds their own participant entry on app load (Security Rules allow member self-write to their own participants/{uid}).
- ✅ Membership guard in AppPage — subscribes to `userHouseholds/{uid}/{householdId}`; redirects to /dashboard if user is removed mid-session or accesses a household URL without permission.
- ✅ Real-time dashboard update on removal — fixed `useHouseholds` bug where `rebuild()` wasn't called after removing a household from `metaMap`, causing the dashboard card to persist until refresh.
- ✅ Leave household — non-owner members see "עזוב בית" in the ⚙️ header menu; removes userHouseholds + participants entry, redirects to dashboard.
- ✅ Delete household — owner sees ✕ button on dashboard cards; confirms → removes all members' access → deletes entire household node. Security Rule added at `households/$householdId` level for owner full-write.
- ✅ Brand color — `--brand: #2563EB` defined in `index.css :root`; JoinPage logo + button use `var(--brand)`; `DEFAULT_COLOR` updated to `#2563EB` in `color.ts` and `SettingsView.tsx`.
- ✅ HeroCard shows actual household name (meta.name) instead of hardcoded string
- ✅ privateIncome filtering applied consistently — HeroCard + MemberView now receive `currentUserId` and filter private income of other members (same logic as SummaryView)
- ✅ Firebase Security Rules — whitelist removed from code; access controlled server-side via `database.rules.json` (deployed to homefine-a7613-default-rtdb)

## Firebase Security Rules (database.rules.json)
- Any authenticated Google user can log in and read household `meta` (needed for JoinPage)
- Household data (members/transactions/logs/etc.) readable/writable only by approved members (`userHouseholds/{uid}/{householdId} = true`)
- Only the owner can manage `joinRequests` and `participants`
- Users can create their own join request; owner approves/denies
- Users can remove themselves from a household (delete their own `userHouseholds` entry)
- Deploy: `firebase deploy --only database`

## What's Planned / Not Yet Built
- ❌ Super Admin panel (metadata only, for app owner)
- ❌ Viewer role (read-only member)
- ❌ True server-side income privacy (E2E encryption or Firestore rules)
