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
- ✅ 19 transaction categories with icons
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
- ✅ AddMemberModal via pills ＋ button
- ✅ Landing page with locale-aware screenshots
- ✅ Home module: Kanban tasks (dnd-kit, 3 columns: לבצע/בתהליך/בוצע) + shopping list
- ✅ Settings + Logs modals (scrollable ap-modal-body pattern)
- ✅ Shared calendar: monthly grid, multi-day events, participants tagging, recurring, EventModal (create/edit/delete)

## What's Planned / Not Yet Built
- ❌ Super Admin panel
- ❌ Viewer role (read-only member)
- ❌ Server-side income privacy
