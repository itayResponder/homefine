---
name: project-permissions-model
description: "HomeFine permission system — owner controls, income privacy, join requests, planned features"
metadata: 
  node_type: memory
  type: project
  originSessionId: f5df75e4-75ff-4da5-adb2-cbcbf5ce690a
---

**Owner** (`meta.ownerId === user.uid`): rename household, toggle expenses-only mode, approve/deny join requests, see notification bell.

**Member**: toggle own income privacy (`member.privateIncome: boolean` — client-side only, not Firebase-enforced).

**Join request flow**: JoinPage creates `joinRequests/{uid}` → owner sees bell badge → approve adds to userHouseholds + removes request | deny just removes request. Shared via `/join/:householdId` URL.

**Income privacy** is client-side filtering only. `member.userId` links a member card to a user account. `member.privateIncome: true` hides their income transactions from other users in SummaryView/IncomeView.

**Why client-side only:** Firebase Realtime DB downloads all data to client, making server-side field-level privacy impossible without restructuring paths or moving to Firestore.

**Firebase Security Rules (deployed 2026-05-31):** Whitelist removed from useAuth.ts. Rules enforce: members can only read/write their own household data; only owner can manage joinRequests, participants, approve/deny access; any authenticated user can read household meta (needed for JoinPage) and create their own join request; users can delete their own userHouseholds entry (leave); rules in `database.rules.json`, deployed via `firebase deploy --only database`.

**Planned but not built:** Super Admin panel (metadata only), viewer role, true server-side income privacy.
