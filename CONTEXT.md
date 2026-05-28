# HomeFine — Project Context

## What is this?
A household finance manager SPA built with React + TypeScript + Firebase.
Part of a larger portfolio (itay-portfolio) with Option B to add more projects later.

## Tech Stack
- React 19 + TypeScript 6 (Vite 8)
- React Router v7 (SPA)
- Firebase: Auth (Google) + Realtime Database + Hosting
- CSS (plain, per-component, no framework)
- Font: Plus Jakarta Sans (loaded via index.html)

## Project Structure
```
src/
  constants/
    categories.ts         ← CATEGORY_ICONS + CATEGORY_LABELS (shared across app)
  utils/
    date.ts               ← todayISO, currentMonth, formatMonth, shiftMonth
  types/
    index.ts              ← Member, Transaction, RecurringCharge, AppUser
  firebase/
    config.ts             ← Firebase init via .env
    db.ts                 ← CRUD + real-time subscriptions
  hooks/
    useAuth.ts            ← Google login + whitelist
    useMembers.ts         ← members CRUD + color assignment
    useTransactions.ts    ← transactions CRUD
  components/
    app/
      AppHeader.tsx + .css         ← logo, month nav, user avatar/logout
      MemberTabs.tsx + .css        ← tabs + inline add-member flow
      SummaryCards.tsx + .css      ← income / expenses / balance cards
      TransactionList.tsx + .css   ← list + empty state + TransactionItem
      AddTransactionModal.tsx + .css ← modal form for adding a transaction
  pages/
    LandingPage.tsx + .css  ← full landing (hero, stats, features, CTA)
    AppPage.tsx             ← thin orchestrator (~85 lines, useMemo)
    AppPage.css             ← ap-root + ap-main only
  index.css               ← minimal global reset (box-sizing, body margin)
  App.tsx                 ← BrowserRouter + auth-gated routes
  main.tsx                ← entry point
```

## Firebase Project
- Project ID: homefine-a7613
- Hosting URL: homefine-a7613.web.app
- Realtime DB: europe-west1

## Whitelist (useAuth.ts)
- itay.responder@gmail.com
- aviv.rom01@gmail.com
- sapir.rahamim21@gmail.com

## What's done
- LandingPage: full design (light blue, Plus Jakarta Sans)
  Hero with mockup preview, Stats, Features grid, CTA section
- AppPage: full app — member tabs, summary cards, transaction list,
  add-transaction modal, month picker, empty state
- All hooks and firebase files
- Firebase connected and running locally
- Component decomposition: AppPage split into 5 focused components
- Shared utils (date) and constants (categories) extracted
- Vite boilerplate CSS cleared; index.css is now a minimal reset

## What's next
- Google Login: test that it works end-to-end
- Deploy to Firebase Hosting
- itay-portfolio: separate repo, GitHub Pages
