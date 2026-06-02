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
| `/app/:householdId` | HouseholdLayout → AppPage | Finance app (כספים) — all finance views |
| `/app/:householdId/home` | HouseholdLayout → HouseholdPage | Household management (ניהול משק בית) — tasks + shopping |

**Layout Route**: `HouseholdLayout.tsx` wraps both `/app/:householdId` routes as a React Router v7 nested layout. It holds all shared hooks (useMembers, usePresence, useUserColor, useHouseholdMeta, useJoinRequests, auth guard, seedParticipant) and renders AppHeader once. Child pages receive shared state via `useOutletContext<HouseholdContextType>()`. Switching between כספים and ניהול משק בית tabs does NOT remount AppHeader or re-run shared hooks.

## AppPage Views (pills nav)
- **סיכום** — per-member summary cards + recent transactions
- **הוצאות** — inline add form + all expenses for month
- **הכנסות** — inline add form + all income for month (hidden if expensesOnly)
- **[member name]** — per-member stats + expenses + income (X button to delete)
- **חיובים קבועים** — recurring charges management
- **לוגים** — change history (via settings gear → dropdown)
- **הגדרות** — member management (chips list + remove), income privacy, owner controls, color theme, export. Add-member form was moved out of Settings to the pills `+` button modal.

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

- ✅ Landing page updated — CTA changed from "התחל בחינם/Start for Free" → "התחל עכשיו/Get Started"; stats updated (removed "חינם/Free", added "מרובה/Multi" — manage multiple households); feature 6 updated from whitelist → invite link + owner approval description; bottom CTA desc updated; hero mockup replaced with real locale-aware screenshots (`/screenshot-he.png`, `/screenshot-en.png` — switches automatically by language).
- ✅ Member card auto-created on household creation — DashboardPage creation form now collects owner name (Hebrew required, English optional); card created via `addMember` from `firebase/db` immediately after household creation with color `#6C63FF`.
- ✅ Add member via pills `+` button — `AddMemberModal.tsx` opens from AppNav's `＋` pill (after member pills). Add-member form removed from SettingsView; member chips list remains there for deletion only.
- ✅ Logo colors fixed & consistent everywhere — "Home" = `#0F172A` (dark), "Fine" = `#2563EB` (blue). Previously DashboardPage used `var(--ac)` (theme-dependent) and JoinPage used `var(--brand)` for the wrong part. App.tsx + AppPage.tsx loaders also had colors inverted. All now match LandingPage and AppHeader.

- ✅ Home module (tasks + shopping) — module switcher כספים/בית above content. Tasks grouped by room with condition bar (fresh/medium/due/overdue based on days-since-done ratio). Auto-rotation among members. Shopping list with real-time sync, one-tap toggle, clear done. Firebase paths: `tasks/` + `shoppingItems/` under household. Components: `src/components/home/` tree. Hooks: `useTasks`, `useShoppingList`. DB: `src/firebase/homeDb.ts`. Types: `src/types/home.ts`. Constants: `src/constants/rooms.ts`. Utils: `src/utils/taskUrgency.ts`. i18n: `t.home.*` section added to all three files.
- ✅ addTask error handling — `HomeView` now catches Firebase write failures and shows a toast (`t.home.addTaskError`). Root cause of silent failures: `database.rules.json` must be deployed with `firebase deploy --only database` for `tasks` + `shoppingItems` paths to be active in production.
- ✅ Two-app architecture — AppPage (כספים) and HouseholdPage (ניהול משק בית) are nested routes under `HouseholdLayout`. AppHeader is rendered once in HouseholdLayout with a two-pill nav (כספים / ניהול משק בית). `onOpenSettings` and `onOpenLogs` passed only when on the finance tab (`isFinanceTab = !pathname.endsWith('/home')`). Auth guard (`subscribeUserMembership`) lives in HouseholdLayout. HouseholdPage is now minimal — just renders HomeView using context data.
- ✅ Kanban board (tasks) — Three **vertical groups** (Monday.com style): צריך לבצע / בתהליך / בוצע, each collapsible. Drag-and-drop via `@dnd-kit/core` + `@dnd-kit/sortable` (PointerSensor + TouchSensor). Supports intra-group reorder (saves `order` field to Firebase via `batchUpdateTaskOrders` multi-path update) and inter-group move (changes `status`). Local state managed with `useRef(dragActive)` to avoid Firebase flicker during drag. Moving to "בתהליך" sets `startedAt`, moving to "בוצע" sets `lastDoneAt` + rotates. Task type: `status?`, `dueDate?`, `estimatedDays?`, `startedAt?`, `order?`. KanbanCard uses `useSortable`. `TaskGroup` (KanbanColumn.tsx) uses `SortableContext` + `useDroppable`. AddTaskModal has optional due date + estimated days fields. **Pending: `firebase deploy --only database` for tasks/shoppingItems rules.**
- ✅ Kanban UI polish — KanbanCard left stripe color follows group status (`kc-card--todo/in-progress/done`), not urgency. Group "בתהליך" colors use `var(--ac)` / `var(--acl)` / `var(--acd)` (follows user theme). KanbanCard shows expanded details: frequency (🔄), estimated days (⏱), due date (📅), and footer row with creator name + creation date. Edit button (✎) on card opens **EditTaskModal** — prefilled with all fields + status selector; saving calls `moveStatus` if status changed (handles timestamps) + `updateTask` for other fields. INTERVALS array moved to `src/constants/tasks.ts` (shared between AddTaskModal + EditTaskModal). New i18n keys in `t.home`: `editTask`, `editTaskTitle`, `statusLabel`, `createdByLabel`, `createdOnLabel`, `estimatedDaysUnit`.
- ✅ AddTaskModal UI consistency — replaced native `<select>` and `<input type="date">` with `CustomSelect` and `CustomDatePicker`. Modal CSS fixed: `overflow: visible` + `max-height: none` on `.ap-modal.atm-modal` (higher specificity) so dropdowns/calendar escape the scroll container. Overlay scrolls on small screens instead of modal. `openUp` prop added to `CustomDatePicker` (calendar opens upward, `bottom: calc(100% + 4px)`). Mobile: 96vw width, larger calendar tap targets, stacked footer buttons.
- ✅ EditTaskModal undefined fix — `updateTask` in `homeDb.ts` now converts `undefined` values to `null` before passing to Firebase (Firebase rejects `undefined`; `null` deletes the field). Affects optional fields: `estimatedDays`, `dueDate`.
- ✅ Layout Route + no re-render on tab switch — `HouseholdLayout.tsx` is a React Router nested layout route. AppHeader and all shared hooks live there and never remount when switching between כספים/ניהול משק בית tabs. Child pages use `useHouseholdContext()` (re-exported from `HouseholdLayout.tsx`). `HouseholdContextType` carries: householdId, user, members, membersReady, online, isOwner, expensesOnly, meta, primaryColor, updateColor, joinRequests, openModal/setOpenModal, updateSettings, renameMeta, toggleMemberIncome, addMember, removeMember.
- ✅ Persistent presence with green/gray dots — `usePresence` stores `{ name, photoURL, ts, online: boolean }` in `presence/{uid}`. On connect: `online: true`. On browser close: Firebase `onDisconnect().update({ online: false })`. On React unmount (navigate away): cleanup sets `online: false`. Avatar disappears ONLY when user is removed from household (`leaveHousehold` / `removeParticipant` both call `remove(presence/{uid})`). AppHeader shows all household users with green dot (online) or gray dot (offline). Shows Google photo if available, else colored initial. User's own avatar icon removed from header (presence avatars replace it). Up to 4 avatars shown, "+N" overflow. CSS: `.ah-online-avatar` (30px), `.ah-online-dot`, `.ah-online-dot--offline`, `.ah-online-photo`.

## What's Planned / Not Yet Built
- ❌ Super Admin panel (metadata only, for app owner)
- ❌ Viewer role (read-only member)
- ❌ True server-side income privacy (E2E encryption or Firestore rules)
