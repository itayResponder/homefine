# HomeFine — מסמך תכנון Refactor

> **שלב 1 בלבד — סריקה ותכנון. אין שינויי קוד.**
> סרוקו: 60+ קבצים, ~8,000 שורות קוד.

---

## 1. בעיות CSS

### 1.1 קבצי CSS שחסרים / לא עקביים

| קובץ | בעיה |
|------|------|
| `src/components/app/AddMemberModal.tsx` | אין קובץ CSS נפרד — כל הסטיילינג דרך inline styles |
| `src/components/app/EditMemberModal.tsx` | אין קובץ CSS נפרד — כל הסטיילינג דרך inline styles |
| `src/components/app/EditTransactionModal.tsx` | אין קובץ CSS נפרד — כל הסטיילינג דרך inline styles |
| `src/components/app/MemberView.tsx` | אין קובץ CSS נפרד — משתמש בקלאסים מ-`AppPage.css` |
| `src/components/app/SummaryView.tsx` | אין קובץ CSS נפרד — משתמש בקלאסים גלובליים |
| `src/components/app/TransactionView.tsx` | אין קובץ CSS נפרד — משתמש בקלאסים גלובליים |
| `src/App.tsx` | Inline loading spinner (`style={{ minHeight: '100vh', display: 'flex', ... }}`) |

### 1.2 Inline Styles — בעיות קשות

**`src/components/app/SettingsView.tsx`** — זהו הקובץ הגרוע ביותר. כמעט כל ה-JSX בנוי על inline styles.
דוגמאות לבעיה:
```tsx
// שורה אחת אחת עם ~200 תכונות CSS מפוזרות:
style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < participants.length - 1 ? '1px solid #F1F5F9' : 'none' }}
style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: myMember.privateIncome ? 'var(--ac)' : '#E2E8F0', transition: 'background .2s', flexShrink: 0, position: 'relative' }}
style={{ fontSize: 11, fontWeight: 700, color: '#9490CC', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}
```
ה-SettingsView.tsx (30.69KB) הוא כמעט כולו inline styles — **אפס קובץ CSS**.

**`src/pages/AppPage.tsx`** — loading state עם inline style:
```tsx
<div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', opacity: 0.6 }}>
```

**`src/pages/DashboardPage.tsx`** — לא נמצאה בעיה — CSS מסודר.

### 1.3 חזרתיות CSS

| בעיה | קבצים מעורבים |
|------|---------------|
| `.ap-modal-overlay` מוגדר ב-`AppPage.css` ו-`AddTransactionModal.css` | שני קבצים |
| `sync-bar` / `sync-dot` מוגדרים ב-`SyncBar.css` וגם ב-`SyncOnlineBar.css` | `SyncBar.css`, `SyncOnlineBar.css` |
| `.online-bar` / `.online-chip` מוגדרים ב-`OnlineBar.css` וגם ב-`SyncOnlineBar.css` | שני קבצים |
| Toggle button (44×24, border-radius:12) — קוד CSS זהה בשני מקומות | `SettingsView.tsx` (inline) — expensesOnly toggle ו-privateIncome toggle |
| `.ap-settings-btn` מוגדר ב-`AppHeader.css` אך משמש לפעמיים בצורות שונות (bell + gear) | `AppHeader.tsx` |
| צבעים hardcoded ישירות (`#1a1a2e`, `#9490CC`, `#F1F5F9`) מוגדרים בעשרות מקומות — לא ב-CSS variables | פרויקט כולו |
| `fmtJoinDate` בתוך `SettingsView.tsx` — פונקציה זהה לפורמט תאריך שכבר קיימת ב-`utils/date.ts` | `SettingsView.tsx`, `utils/date.ts` |

### 1.4 ערכי CSS גלובליים vs. ספציפיים

`AppPage.css` הוא "CSS מרכזי" גדול מדי (22KB) שמכיל:
- Classes של Modal שאמורים להיות בקומפוננטות ספציפיות
- Classes של `CustomSelect` ו-`CustomDatePicker` שיושבים בפורמט גלובלי
- Classes של `Recurring`, `Entry`, `Hero` — הכל יחד

---

## 2. בעיות ארכיטקטורה

### 2.1 קומפוננטות גדולות מדי

| קובץ | גודל | בעיה |
|------|------|-------|
| `src/components/app/SettingsView.tsx` | **30.69 KB** | 7 אזורי UI שונים בקובץ אחד: Owner Settings, Participants, Income Privacy, Members, Categories, Color Theme, Automation, Export |
| `src/pages/AppPage.tsx` | **15.82 KB** | מנהל handlers של transactions, recurring, members, participants — לוגיקה שאמורה להפרד |
| `src/pages/DashboardPage.tsx` | **13.62 KB** | מכיל Header, Create Modal, Cards Grid, Notifications — כולם inline |
| `src/components/app/RecurringSection.tsx` | **11.84 KB** | מכיל Form + List + RecurringItem כתת-קומפוננטה — ניתן לפצל |
| `src/components/app/LogsSection.tsx` | **6.91 KB** | מכיל LogRow + LogDetailModal כתת-קומפוננטות — ניתן לפצל |

### 2.2 לוגיקה שצריכה לעבור ל-Hook

| לוגיקה | נמצאת ב | אמורה להיות ב |
|---------|----------|---------------|
| `computeDiffs()` — פונקציה עסקית בתוך קומפוננטה | `AppPage.tsx` (שורה 28) | `utils/transactions.ts` או hook |
| Auto-apply recurring + debounce timer (useRef, useEffect) | `AppPage.tsx` (שורות 65–77) | `useRecurringAutoApply` hook |
| Participants subscription (`useEffect` + `subscribeParticipants`) | `AppPage.tsx` (שורות 57–62) | ל-`HouseholdLayout.tsx` (שם מנוהלים שאר הנתונים) או hook נפרד |
| `generateMacroDroidFile()` — 80+ שורות של לוגיקה עסקית | `SettingsView.tsx` (שורות 12–60) | `utils/macroDroid.ts` |
| `handleDownloadMacro`, `handleTestWebhook`, `handleGenerateKey` | `SettingsView.tsx` | hook `useWebhookAutomation` |
| `fmtJoinDate()` — פונקציה לפורמט תאריך | `SettingsView.tsx` (שורה 64) | `utils/date.ts` |
| Outside-click handler pattern (useRef + addEventListener) | `DashboardPage.tsx`, `AppHeader.tsx` | hook `useClickOutside` (פעמיים זהה!) |
| dropdown open/close state + keyboard close | `DashboardPage.tsx`, `AppHeader.tsx` | hook גנרי |
| `nameToColor()` — hash function | `AppHeader.tsx` (שורות 22–25) | `utils/color.ts` (כבר קיים שם לוגיקה דומה) |

### 2.3 Props Drilling עמוק

`HouseholdLayout.tsx` → `AppPage.tsx` → `SettingsView.tsx` מקבלת **17 props** (categories, members, logs, transactions, recurringCharges, primaryColor, isOwner, meta, participants, onRemoveMember, onColorChange, onUpdateSettings, onRename, onToggleMemberIncome, onRemoveParticipant, onRenameMember, onAddCategory, onUpdateCategory, onDeleteCategory).

פתרון: SettingsView צריכה לצרוך ישירות מה-`HouseholdContext` במקום לקבל הכל כ-props.

---

## 3. קוד לא בשימוש

### 3.1 קומפוננטות שלא ברור אם בשימוש

| קובץ | בעיה |
|------|------|
| `src/components/app/SyncBar.tsx` + `SyncBar.css` | `SyncBar` ו-`SyncOnlineBar` קיימים במקביל. `SyncOnlineBar` ממזג שניהם — ייתכן ש-`SyncBar` כבר לא בשימוש בפועל |
| `src/components/app/OnlineBar.tsx` + `OnlineBar.css` | גם `OnlineBar` וגם `SyncOnlineBar` מציגים משתמשים online — ייתכן כפילות |
| `src/components/app/UserBar.tsx` + `UserBar.css` | אין ייבוא ל-`UserBar` ב-AppPage, HouseholdLayout, AppHeader — **ייתכן שלא בשימוש כלל** |
| `src/components/app/SummaryCards.tsx` + `SummaryCards.css` | אין ייבוא ב-`SummaryView.tsx` — **ייתכן שלא בשימוש** |
| `src/App.css` | לא ברור אם יש תוכן משמעותי שמשמש |
| `OLD_BAYIT_SHELANU.html` (בשורש!) | קובץ ישן שנשאר — צריך למחוק |

### 3.2 Imports מיותרים

| קובץ | Import מיותר |
|------|-------------|
| `src/pages/AppPage.tsx` | `import { useToast } from '../contexts/ui'` ו-`import { useConfirm } from '../contexts/ui'` — שני imports נפרדים לאותו מודול (ניתן לאחד) |
| `src/pages/AppPage.tsx` | `import type { LogDiff, RecurringCharge, Transaction } from '../types'` — `LogDiff` יכול להיות פחות גלוי |

### 3.3 קבצים שלא ברורה מטרתם

| קובץ | בעיה |
|------|------|
| `src/pages/HouseholdPage.tsx` (557 bytes!) | קובץ כמעט ריק — מה תפקידו? |
| `src/components/app/AppNav.tsx` | קיים AppNav + AppHeader עם nav בפנים — שתי ניווטות? |

---

## 4. חזרתיות בקוד

### 4.1 לוגיקה שמופיעה פעמיים ויותר

| דפוס חוזר | מיקומים |
|-----------|---------|
| Outside click handler (`useRef` + `addEventListener('mousedown')`) | `DashboardPage.tsx` (שורות 40–45), `AppHeader.tsx` (שורות 37–41) — **קוד זהה לחלוטין** |
| `defaultMemberId` calculation (`members.find(m => m.userId === currentUserId)?.id ?? 'shared'`) | `TransactionView.tsx`, `RecurringSection.tsx`, `AppPage.tsx` — **שלוש פעמים** |
| `isRtl` = `t.dir === 'rtl'` | `SettingsView.tsx`, `DashboardPage.tsx`, `AppHeader.tsx`, `RecurringSection.tsx`, `LogsSection.tsx` — **חמש פעמים לפחות** |
| Confirmation modal pattern (`showConfirm` + `if (!confirmed) return`) | `AppPage.tsx` שלוש פעמים, `DashboardPage.tsx`, `HouseholdLayout.tsx` |
| Firebase subscribe pattern (`useEffect` + `onValue` + `return unsub`) | **16 hooks** — הפטרן זהה בכולם, אין abstraction |
| Toggle button (44×24) CSS inline | `SettingsView.tsx` שני מקומות זהים (expensesOnly toggle, privateIncome toggle) |
| `sort((a,b) => b.date.localeCompare(a.date) \|\| b.createdAt - a.createdAt)` | `TransactionView.tsx`, `MemberView.tsx` |
| `formatYearMonth` + חישוב endYearMonth | `RecurringSection.tsx` (RecurringItem) — logic שניתן ל-`utils/recurring.ts` |
| `addLog({ action, entityType, who, ts: Date.now(), ... })` | `AppPage.tsx` — 5 קריאות עם מבנה דומה, ללא helper |
| `t.dir === 'rtl' ? 'Hebrew text' : 'English text'` | **מאות מקומות** ב-`SettingsView.tsx`, `LogsSection.tsx` — inline i18n שלא משתמש במערכת ה-i18n |

### 4.2 Inline i18n במקום שימוש במערכת הקיימת

`SettingsView.tsx` ו-`LogsSection.tsx` מכילים עשרות טקסטים hardcoded:
```tsx
// ב-SettingsView.tsx
isRtl ? 'שם הבית' : 'Household name'
isRtl ? 'שנה שם' : 'Rename'
isRtl ? 'הגדרות בעלים' : 'Owner Settings'
isRtl ? 'גישה לבית' : 'Household Access'
// ...ועשרות נוספים
```
אלה **לא** מוגדרים ב-`he.ts` / `en.ts` — עוקפים את מערכת ה-i18n.

---

## 5. בעיות TypeScript

### 5.1 שימוש ב-`any` מרומז או בעיות type

| קובץ | בעיה |
|------|------|
| `src/firebase/db.ts` שורה 159 | `const data = await res.json() as { ok: boolean; error?: string }` — cast ישיר ללא validation |
| `src/components/app/SettingsView.tsx` — `generateMacroDroidFile` | מחזיר JSON object ידני ללא type — כל ה-MacroDroid config הוא `any` בפועל |
| `src/pages/HouseholdLayout.tsx` שורה 111 | `seedParticipant(...).catch(() => {})` — שגיאות נבלעות בשקט |
| `src/hooks/useMembers.ts` | `CARD_COLORS` — array ב-module scope ללא `as const`, type נגזר רחב מדי |

### 5.2 Types חסרים / שמות לא ברורים

| קובץ | בעיה |
|------|------|
| `src/firebase/db.ts` | `JoinRequestData` type מוגדר locally אבל `JoinRequest` ב-`types/index.ts` — אינם זהים, יוצר בלבול |
| `src/firebase/db.ts` | `ParticipantData` type מוגדר locally, אבל `Participant` כבר קיים ב-`types/index.ts` |
| `src/components/app/SettingsView.tsx` | `Props` interface — שם גנרי מדי, צריך `SettingsViewProps` |
| `src/contexts/ui.tsx` | `ToastItem` interface — private, לא exported, בסדר; אבל `ToastCtxType` ו-`ConfirmCtxType` יכולות להיות ב-`types/` |
| `src/hooks/usePresence.ts` | `PresenceMap` exported מ-hook — type שמייצג data shape צריך להיות ב-`types/` |
| `src/firebase/db.ts` | `PresenceRecord` type מוגדר ב-`db.ts` ומיובא משם — אמור להיות ב-`types/` |
| `src/components/app/RecurringSection.tsx` | `FormState` interface — private, טוב; אבל זהה ב-`TransactionView.tsx` (שמות שונים, מבנה דומה) |

### 5.3 שמות משתנים לא ברורים

| מיקום | שם | בעיה |
|--------|-----|-------|
| `AppPage.tsx` | `who` | מה זה `who`? צריך `currentUserName` |
| `AppPage.css` / כל הפרויקט | `fcard`, `fttl`, `fg`, `fl`, `sbtn` | קיצורים קריפטיים ללא תיעוד |
| `AppPage.css` | `htop`, `hbal`, `hbal-lbl`, `hboxes`, `hbox` | CSS classes לא קריאים |
| `HeroCard.tsx` | `monthIdx0` | שם מוזר — `monthIndex` (0-based) |
| `RecurringSection.tsx` | `mc` (שורה בתוך handleSubmit) | `monthCountError` יהיה הרבה יותר ברור |
| `AppPage.tsx` | `txRef` | `transactionsRef` יהיה ברור יותר |
| `AppPage.tsx` | `applyTimerRef` | `recurringApplyTimerRef` יהיה ברור יותר |
| `utils/color.ts` | `mix()` | פונקציה ללא תיעוד — `mixWithWhite()` יהיה ברור יותר |

---

## 6. בעיות שמות — קבצים, משתנים, פונקציות

### 6.1 שמות קבצים לא עקביים

| קובץ | בעיה |
|------|------|
| `src/components/app/TxEntry.tsx` | קיצור — `TransactionEntry.tsx` |
| `src/components/app/HeroCard.tsx` | שם לא מתאר — זה `MonthSummaryCard` או `FinanceHero` |
| `src/utils/format.ts` | קיצור — מה בפנים? `formatCurrency` בלבד? שם רחב מדי |
| `src/utils/date.ts` | `currentMonth`, `todayISO` — פונקציות? קבועים? |
| `src/contexts/ui.tsx` | `ui.tsx` — שם גנרי. `UIContext.tsx` יהיה ברור יותר |
| `src/types/home.ts` | מה ההבדל בין `home.ts` ל-`index.ts` ב-types? לא ברור |

### 6.2 שמות פונקציות לא עקביים

| קובץ | פונקציה | בעיה |
|------|---------|-------|
| `useTransactions.ts` | `remove` (exported) | `removeTransaction` יהיה ברור יותר |
| `useRecurring.ts` | `remove`, `add`, `update` | גנריים מדי — `addRecurring`, `removeRecurring` |
| `useMembers.ts` | `add`, `remove` | גנריים מדי |
| `AppPage.tsx` | `handleEditSave` | `handleSaveTransactionEdit` יהיה ברור יותר |
| `AppPage.tsx` | `handleAddTransaction`, `handleDeleteTx` | לא עקבי — אחד `Transaction` ואחד `Tx` |

---

## 7. בעיות חלוקה לתיקיות

### 7.1 קבצים במיקום הלא נכון

| קובץ נוכחי | מיקום מומלץ | סיבה |
|------------|------------|-------|
| `src/components/LanguageToggle.tsx` + `LanguageToggle.css` | `src/components/ui/LanguageToggle.tsx` | זו קומפוננטת UI גנרית, כמו שאר ה-`ui/` |
| `src/contexts/ui.tsx` + `ui.css` | `src/providers/UIProvider.tsx` או `src/components/providers/` | Context providers לא "contexts" בלבד — הם גם מרנדרים |
| `src/firebase/db.ts` | לפצל ל: `src/firebase/households.ts`, `src/firebase/members.ts`, `src/firebase/transactions.ts`, `src/firebase/webhooks.ts` | קובץ אחד של 400+ שורות עם 40+ functions |
| `src/components/app/WebhookLogModal.tsx` | `src/components/app/settings/WebhookLogModal.tsx` | שייך לאזור ה-Settings |
| `src/components/app/CategoryManager.tsx` | `src/components/app/settings/CategoryManager.tsx` | שייך לאזור ה-Settings |
| `src/components/app/EditMemberModal.tsx` | `src/components/app/settings/EditMemberModal.tsx` | שייך לאזור ה-Settings |
| `src/components/app/UserBar.tsx` | לבדוק אם בשימוש ואז `src/components/app/` או מחיקה | ייתכן orphan |
| `src/components/app/SummaryCards.tsx` | לבדוק אם בשימוש ואז `src/components/app/` או מחיקה | ייתכן orphan |
| `OLD_BAYIT_SHELANU.html` | מחיקה | קובץ שורש שלא שייך לפרויקט |
| `src/types/home.ts` vs `src/types/index.ts` | לאחד ל-`src/types/index.ts` + `src/types/calendar.ts` | החלוקה הנוכחית לא ברורה |

### 7.2 חסרות תיקיות

| תיקייה חסרה | מה אמור לכנס אליה |
|------------|-----------------|
| `src/components/app/settings/` | SettingsView, CategoryManager, EditMemberModal, WebhookLogModal |
| `src/components/app/finance/` | TransactionView, TransactionList, TxEntry, HeroCard, SummaryView, SummaryCards, MemberView |
| `src/components/app/recurring/` | RecurringSection |
| `src/firebase/` (פיצול) | `households.ts`, `members.ts`, `transactions.ts`, `presence.ts`, `webhooks.ts` |
| `src/utils/` | הוספת `transactions.ts` (computeDiffs, addLog helpers) |

---

## 8. סדר עדיפויות לתיקון

### 🔴 עדיפות גבוהה — משפיע על יכולת תחזוקה מיידית

| # | בעיה | קבצים | מאמץ |
|---|------|--------|------|
| 1 | **SettingsView.tsx — inline styles → קובץ CSS** | `SettingsView.tsx` → `SettingsView.css` | גבוה |
| 2 | **SettingsView.tsx — פיצול לקומפוננטות** | 7 sections → 7 קבצים | גבוה |
| 3 | **generateMacroDroidFile → utils** | `SettingsView.tsx` → `utils/macroDroid.ts` | נמוך |
| 4 | **useWebhookAutomation hook** | לוגיקת Webhook מ-SettingsView | בינוני |
| 5 | **פיצול firebase/db.ts** | → 5 קבצים | בינוני |

### 🟡 עדיפות בינונית — בעיות חזרתיות ומבנה

| # | בעיה | קבצים | מאמץ |
|---|------|--------|------|
| 6 | **useClickOutside hook** | DashboardPage + AppHeader | נמוך |
| 7 | **defaultMemberId → hook/util** | 3 קומפוננטות | נמוך |
| 8 | **Inline i18n → he.ts / en.ts** | SettingsView, LogsSection | בינוני |
| 9 | **AppPage.tsx — auto-recurring → hook** | `useRecurringAutoApply` | נמוך |
| 10 | **ביטול כפילות CSS** | SyncBar + SyncOnlineBar, OnlineBar | נמוך |
| 11 | **בדיקת orphan components** | UserBar, SummaryCards | נמוך |
| 12 | **הזזת LanguageToggle → ui/** | `components/LanguageToggle.tsx` | נמוך |

### 🟢 עדיפות נמוכה — שיפורים, שמות, TypeScript

| # | בעיה | קבצים | מאמץ |
|---|------|--------|------|
| 13 | **שמות משתנים** | AppPage, RecurringSection, utils | נמוך |
| 14 | **Types מ-firebase/db.ts → types/** | `JoinRequestData`, `ParticipantData`, `PresenceRecord` | נמוך |
| 15 | **Props חלקי SettingsView → Context** | HouseholdLayout, AppPage, SettingsView | בינוני |
| 16 | **חלוקה מחדש של תיקיות** | components/app/settings/, components/app/finance/ | בינוני |
| 17 | **CSS variable לצבעים hardcoded** | פרויקט כולו (`#1a1a2e`, `#9490CC`) | בינוני |
| 18 | **מחיקת OLD_BAYIT_SHELANU.html** | שורש פרויקט | נמוך |

---

## סיכום מספרי

| קטגוריה | כמות בעיות |
|---------|------------|
| בעיות CSS (inline, חסרים, כפילות) | 15 |
| בעיות ארכיטקטורה (קומפוננטות גדולות, props drilling) | 8 |
| קוד לא בשימוש (orphans, imports) | 7 |
| חזרתיות בקוד | 10 |
| בעיות TypeScript | 8 |
| בעיות שמות | 12 |
| בעיות חלוקה לתיקיות | 10 |
| **סה"כ** | **~70 נקודות לתיקון** |

הפריט הדחוף ביותר הוא **SettingsView.tsx** — בקובץ אחד (30KB) מרוכזים כמעט כל סוגי הבעיות: inline styles, קומפוננטה גדולה מדי, לוגיקה עסקית, inline i18n, ו-props drilling.
