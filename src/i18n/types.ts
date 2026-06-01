// src/i18n/types.ts
import type { TransactionCategory } from '../types'

export type Lang = 'en' | 'he'

export interface MockupTx {
    icon: string
    desc: string
    sub: string
    amt: string
    neg: boolean
}

export interface T {
    dir: 'ltr' | 'rtl'
    locale: string

    // ── Shared actions ──────────────────────────────────
    cancel: string
    deleteBtn: string
    saveChanges: string

    // ── App identity (hero card) ─────────────────────────
    appName: string
    appSubtitle: string
    monthlyBalance: string
    shortExp: string
    shortInc: string
    monthNames: [string,string,string,string,string,string,string,string,string,string,string,string]
    monthNamesShort: [string,string,string,string,string,string,string,string,string,string,string,string]

    // ── Tab labels ───────────────────────────────────────
    tabSummary: string
    tabExpenses: string
    tabIncome: string
    tabSettings: string
    navRecurring: string   // kept for AppNav compat
    navLogs: string        // kept for AppNav compat
    navFinance: string
    navHousehold: string

    // ── Core app UI ──────────────────────────────────────
    signOut: string
    myHouseholds: string
    shared: string          // with emoji — for tab/select
    sharedLabel: string     // plain — for titles & who-tags
    addMember: string
    memberPlaceholder: string
    add: string
    income: string
    expenses: string
    balance: string

    // ── Summary view ─────────────────────────────────────
    recentActivity: string
    noActivity: string

    // ── Expense / Income inline form ─────────────────────
    newExpenseTitle: string
    newIncomeTitle: string
    expensesThisMonth: string
    incomeThisMonth: string
    addExpenseBtn: string
    addIncomeBtn: string
    expensePlaceholder: string
    incomePlaceholder: string
    noExpenses: string
    noIncome: string

    // ── Member view ───────────────────────────────────────
    memberExpensesTitle: (name: string) => string
    memberIncomeTitle: (name: string) => string
    noMemberExpenses: (name: string) => string
    noMemberIncome: (name: string) => string

    // ── Edit transaction ─────────────────────────────────
    addTransactionTitle: string
    editTransactionTitle: string
    typeLabel: string
    amountLabel: string
    descriptionLabel: string
    descriptionPlaceholder: string
    categoryLabel: string
    whoLabel: string
    dateLabel: string
    expenseLabel: string
    incomeLabel: string
    submitBtn: string
    deleteConfirm: string
    categoryNames: Record<TransactionCategory, string>
    categoryOptions: Record<TransactionCategory, string>

    // ── Confirm dialogs ──────────────────────────────────
    confirmDeleteTxTitle: string
    confirmDeleteTxSub: (name: string, amount: string) => string
    confirmDeleteRecurringTitle: string
    confirmDeleteRecurringSub: (name: string) => string

    // ── Toasts ──────────────────────────────────────────
    toastTxAdded: string
    toastTxUpdated: string
    toastTxDeleted: string
    toastRecAdded: string
    toastRecDeleted: string

    // ── Recurring section ────────────────────────────────
    recurringTitle: string
    newRecurringTitle: string
    recurringExpense: string
    recurringIncome: string
    dayLabel: string
    dayPlaceholder: string
    addRecurringBtn: string
    activeChargesTitle: string
    noRecurring: string
    recurringBadge: string

    // ── Logs section ─────────────────────────────────────
    logsTitle: string
    noLogs: string
    logAdd: string
    logEdit: string
    logDelete: string
    logTransaction: string
    logRecurring: string

    // ── Settings ─────────────────────────────────────────
    exportTitle: string
    exportJsonBtn: string
    categoriesLabel: string
    membersLabel: string
    memberNameLabel: string
    memberNameEnLabel: string
    memberNamePlaceholder: string
    memberNameEnPlaceholder: string

    // ── Presence / Sync ──────────────────────────────────
    onlineNow: string
    nobodyOnline: string
    syncConnected: string
    syncConnecting: string

    // ── Home module (tasks + shopping) ───────────────────
    home: {
        moduleFinance: string
        moduleHome: string
        tabTasks: string
        tabShopping: string
        roomBathroom: string
        roomKitchen: string
        roomLiving: string
        roomBedroom: string
        roomOutdoor: string
        roomGeneral: string
        addTaskBtn: string
        taskTitleLabel: string
        taskTitlePlaceholder: string
        roomLabel: string
        assignLabel: string
        rotation: string
        intervalLabel: string
        intervalOnce: string
        intervalDaily: string
        interval2Days: string
        intervalWeekly: string
        interval2Weeks: string
        intervalMonthly: string
        markDone: string
        lastDoneToday: string
        lastDoneDays: (n: number) => string
        neverDone: string
        noTasks: string
        deleteTask: string
        currentTurn: (name: string) => string
        urgencyFresh: string
        urgencyMedium: string
        urgencyDue: string
        urgencyOverdue: string
        shoppingPlaceholder: string
        addItemBtn: string
        clearDone: string
        doneDivider: string
        noItems: string
        addTaskError: string
    }

    // ── Landing page ─────────────────────────────────────
    landing: {
        navCta: string
        navOpen: string
        badge: string
        h1Line1: string
        h1Highlight: string
        desc: string
        ctaPrimary: string
        ctaGhost: string
        mockupMonth: string
        mockupRecentTitle: string
        mockupTxs: MockupTx[]
        mockupTabs: string[]
        stats: { num: string; label: string }[]
        featuresLabel: string
        featuresTitle: string
        featuresTitleHighlight: string
        features: { icon: string; title: string; desc: string }[]
        ctaBottomTitle: string
        ctaBottomHighlight: string
        ctaBottomDesc: string
        ctaBottomBtn: string
        footer: string
    }
}
