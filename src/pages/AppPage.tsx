// src/pages/AppPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { useTransactions } from '../hooks/useTransactions'
import { useRecurring } from '../hooks/useRecurring'
import { useLogs } from '../hooks/useLogs'
import { usePresence } from '../hooks/usePresence'
import { useSyncStatus } from '../hooks/useSyncStatus'
import { useI18n } from '../i18n/context'
import { useToast } from '../contexts/ui'
import { useConfirm } from '../contexts/ui'
import { AppHeader } from '../components/app/AppHeader'
import { SyncBar } from '../components/app/SyncBar'
import { OnlineBar } from '../components/app/OnlineBar'
import { AppNav } from '../components/app/AppNav'
import { HeroCard } from '../components/app/HeroCard'
import { SummaryView } from '../components/app/SummaryView'
import { ExpensesView } from '../components/app/ExpensesView'
import { IncomeView } from '../components/app/IncomeView'
import { MemberView } from '../components/app/MemberView'
import { RecurringSection } from '../components/app/RecurringSection'
import { LogsSection } from '../components/app/LogsSection'
import { SettingsView } from '../components/app/SettingsView'
import { EditTransactionModal } from '../components/app/EditTransactionModal'
import { currentMonth } from '../utils/date'
import { applyRecurring } from '../utils/recurring'
import { useUserColor } from '../hooks/useUserColor'
import { buildColorVars } from '../utils/color'
import { formatCurrency } from '../utils/format'
import type { LogDiff, RecurringCharge, Transaction } from '../types'
import './AppPage.css'

function computeDiffs(before: Transaction, after: Partial<Transaction>): LogDiff[] {
    const fields = ['description', 'amount', 'category', 'memberId', 'date'] as const
    return fields
        .filter((k) => after[k] !== undefined && String(before[k]) !== String(after[k]))
        .map((k) => ({ field: k, before: String(before[k]), after: String(after[k]!) }))
}

export default function AppPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { members, add: addMember, remove: removeMember } = useMembers()
    const { transactions, add: addTransaction, remove: removeTransaction, update: updateTransaction } = useTransactions()
    const { recurringCharges, add: addRecurring, remove: removeRecurring } = useRecurring()
    const { logs, add: addLog } = useLogs()
    const online = usePresence(user)
    const syncStatus = useSyncStatus()
    const { t } = useI18n()
    const { showToast } = useToast()
    const { showConfirm } = useConfirm()
    const { color: primaryColor, loading: colorLoading, updateColor } = useUserColor(user?.uid)

    // ── UI state ──────────────────────────────────────────────────────────────
    const [view, setView] = useState('summary')
    const [month, setMonth] = useState(currentMonth)
    const [editingTx, setEditingTx] = useState<Transaction | null>(null)
    const [modal, setModal] = useState<'settings' | 'logs' | null>(null)

    // ── Auto-apply recurring charges ──────────────────────────────────────────
    const txRef = useRef(transactions)
    useEffect(() => { txRef.current = transactions }, [transactions])

    useEffect(() => {
        const [year, m] = month.split('-').map(Number)
        applyRecurring(recurringCharges, txRef.current, year, m - 1)
    }, [month, recurringCharges])

    const who = user?.displayName ?? '?'

    // ── Handlers — transactions ───────────────────────────────────────────────
    const handleAddTransaction = async (tx: Omit<Transaction, 'id'>) => {
        await addTransaction(tx)
        addLog({
            action: 'add', entityType: 'transaction', who, ts: Date.now(),
            description: tx.description, amount: tx.amount,
            memberId: tx.memberId, txType: tx.type,
        })
        showToast(t.toastTxAdded)
    }

    const handleDeleteTx = async (tx: Transaction) => {
        const confirmed = await showConfirm({
            title: t.confirmDeleteTxTitle,
            sub: t.confirmDeleteTxSub(tx.description, formatCurrency(tx.amount, t.dir)),
            danger: true,
        })
        if (!confirmed) return
        await removeTransaction(tx.id)
        addLog({
            action: 'delete', entityType: 'transaction', who, ts: Date.now(),
            description: tx.description, amount: tx.amount,
            memberId: tx.memberId, txType: tx.type,
        })
        showToast(t.toastTxDeleted)
    }

    const handleEditSave = async (id: string, changes: Partial<Transaction>) => {
        const before = transactions.find((tx) => tx.id === id)
        if (!before) return
        const diffs = computeDiffs(before, changes)
        await updateTransaction(id, changes)
        addLog({
            action: 'edit', entityType: 'transaction', who, ts: Date.now(),
            description: changes.description ?? before.description,
            amount: changes.amount ?? before.amount,
            memberId: changes.memberId ?? before.memberId,
            txType: changes.type ?? before.type,
            diffs,
        })
        showToast(t.toastTxUpdated)
        setEditingTx(null)
    }

    // ── Handlers — recurring ──────────────────────────────────────────────────
    const handleAddRecurring = async (charge: Omit<RecurringCharge, 'id'>) => {
        await addRecurring(charge)
        addLog({
            action: 'add', entityType: 'recurring', who, ts: Date.now(),
            description: charge.description, amount: charge.amount,
            memberId: charge.memberId, txType: charge.type,
        })
        showToast(t.toastRecAdded)
    }

    const handleDeleteRecurring = async (r: RecurringCharge) => {
        const confirmed = await showConfirm({
            title: t.confirmDeleteRecurringTitle,
            sub: t.confirmDeleteRecurringSub(r.description),
            danger: true,
        })
        if (!confirmed) return
        const relatedIds = transactions.filter((tx) => tx.recurringId === r.id).map((tx) => tx.id)
        await Promise.all(relatedIds.map((id) => removeTransaction(id)))
        await removeRecurring(r.id)
        addLog({
            action: 'delete', entityType: 'recurring', who, ts: Date.now(),
            description: r.description, amount: r.amount, memberId: r.memberId,
        })
        showToast(t.toastRecDeleted)
    }

    // ── Handlers — members ───────────────────────────────────────────────────
    const handleAddMember = (name: string, nameEn?: string) => addMember(name, nameEn, user?.uid)

    // Default "of who" to the current user's member card, or 'shared' if not found
    const handleRemoveMember = async (id: string) => {
        const m = members.find((x) => x.id === id)
        if (!m) return
        const txCount = transactions.filter((tx) => tx.memberId === id).length
        const recCount = recurringCharges.filter((r) => r.memberId === id).length
        const details = [
            txCount > 0 ? `${txCount} עסקאות` : '',
            recCount > 0 ? `${recCount} חיובים קבועים` : '',
        ].filter(Boolean).join(' ו-')
        const confirmed = await showConfirm({
            title: `מחיקת ${m.name}`,
            sub: details
                ? `למחוק את ${m.name} יחד עם ${details} שמשויכים אליו?`
                : `למחוק את ${m.name}?`,
            danger: true,
        })
        if (!confirmed) return
        // Delete all transactions for this member
        await Promise.all(
            transactions.filter((tx) => tx.memberId === id).map((tx) => removeTransaction(tx.id))
        )
        // Delete all recurring charges for this member
        await Promise.all(
            recurringCharges.filter((r) => r.memberId === id).map((r) => removeRecurring(r.id))
        )
        await removeMember(id)
        if (view === `member:${id}`) setView('summary')
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    if (colorLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563EB', letterSpacing: '-0.02em', opacity: 0.6 }}>
                    Home<span style={{ color: '#0F172A' }}>Fine</span>
                </span>
            </div>
        )
    }

    return (
        <div className="ap-root" style={buildColorVars(primaryColor) as React.CSSProperties}>
            <AppHeader
                user={user}
                onLogout={handleLogout}
                onOpenSettings={() => setModal('settings')}
                onOpenLogs={() => setModal('logs')}
            />
            <SyncBar status={syncStatus} />
            <OnlineBar online={online} />

            <div className="wrap">
                <HeroCard
                    members={members}
                    transactions={transactions}
                    month={month}
                    onMonthChange={setMonth}
                />

                <AppNav view={view} members={members} onChange={setView} onRemoveMember={handleRemoveMember} />

                {view === 'summary' && (
                    <SummaryView
                        transactions={transactions}
                        members={members}
                        month={month}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {view === 'expenses' && (
                    <ExpensesView
                        transactions={transactions}
                        members={members}
                        month={month}
                        currentUserId={user?.uid}
                        onAdd={handleAddTransaction}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {view === 'income' && (
                    <IncomeView
                        transactions={transactions}
                        members={members}
                        month={month}
                        currentUserId={user?.uid}
                        onAdd={handleAddTransaction}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {view.startsWith('member:') && (
                    <MemberView
                        memberId={view.slice(7)}
                        transactions={transactions}
                        members={members}
                        month={month}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {view === 'recurring' && (
                    <RecurringSection
                        recurringCharges={recurringCharges}
                        members={members}
                        currentUserId={user?.uid}
                        onAdd={handleAddRecurring}
                        onDelete={handleDeleteRecurring}
                    />
                )}

            </div>

            {modal && (
                <div className="ap-modal-overlay" onClick={() => setModal(null)}>
                    <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ap-modal-header">
                            <span className="ap-modal-title">
                                {modal === 'settings' ? t.tabSettings : t.navLogs}
                            </span>
                            <button className="ap-modal-close" onClick={() => setModal(null)}>✕</button>
                        </div>
                        {modal === 'settings' && (
                            <SettingsView
                                transactions={transactions}
                                recurringCharges={recurringCharges}
                                members={members}
                                logs={logs}
                                onAddMember={handleAddMember}
                                onRemoveMember={handleRemoveMember}
                                primaryColor={primaryColor}
                                onColorChange={updateColor}
                            />
                        )}
                        {modal === 'logs' && <LogsSection logs={logs} />}
                    </div>
                </div>
            )}

            {editingTx && (
                <EditTransactionModal
                    tx={editingTx}
                    members={members}
                    onClose={() => setEditingTx(null)}
                    onSave={handleEditSave}
                />
            )}
        </div>
    )
}
