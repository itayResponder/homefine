// src/pages/AppPage.tsx
import { useEffect, useState } from 'react'
import { useHouseholdContext } from './HouseholdLayout'
import { useTransactions } from '../hooks/useTransactions'
import { useRecurring } from '../hooks/useRecurring'
import { useLogs } from '../hooks/useLogs'
import { useI18n } from '../i18n/context'
import { useToast, useConfirm } from '../contexts/ui'
import { AppNav } from '../components/app/AppNav'
import { HeroCard } from '../components/app/finance/HeroCard'
import { SummaryView } from '../components/app/finance/SummaryView'
import { TransactionView } from '../components/app/finance/TransactionView'
import { MemberView } from '../components/app/finance/MemberView'
import { RecurringSection } from '../components/app/recurring/RecurringSection'
import { LogsSection } from '../components/app/LogsSection'
import { SettingsView } from '../components/app/SettingsView'
import { EditTransactionModal } from '../components/app/EditTransactionModal'
import { AddMemberModal } from '../components/app/AddMemberModal'
import { currentMonth } from '../utils/date'
import { computeDiffs } from '../utils/transactions'
import { useRecurringAutoApply } from '../hooks/useRecurringAutoApply'
import { subscribeParticipants, removeParticipant, updateMember } from '../firebase/db'
import type { Participant } from '../types'
import { formatCurrency } from '../utils/format'
import type { RecurringCharge, Transaction } from '../types'
import './AppPage.css'

export default function AppPage() {
    const {
        householdId, user, members, membersReady,
        isOwner, expensesOnly, meta,
        openModal, setOpenModal,
        addMember: ctxAddMember, removeMember: ctxRemoveMember,
        categories,
    } = useHouseholdContext()

    const { transactions, ready: txReady, add: addTransaction, remove: removeTransaction, update: updateTransaction } = useTransactions(householdId)
    const { recurringCharges, ready: recurringReady, add: addRecurring, remove: removeRecurring } = useRecurring(householdId)
    const { logs, add: addLog, remove: removeLog, clear: clearLogs } = useLogs(householdId)
    const { t } = useI18n()
    const { showToast } = useToast()
    const { showConfirm } = useConfirm()

    // Participants — owner only, for SettingsView
    const [participants, setParticipants] = useState<Participant[]>([])
    useEffect(() => {
        if (!isOwner || !householdId) return
        return subscribeParticipants(householdId, setParticipants)
    }, [isOwner, householdId])

    // ── UI state ──────────────────────────────────────────────────────────────
    const [view, setView] = useState('summary')
    const [month, setMonth] = useState(currentMonth)
    const [editingTx, setEditingTx] = useState<Transaction | null>(null)
    const [showAddMember, setShowAddMember] = useState(false)

    // ── Auto-apply recurring charges ──────────────────────────────────────────
    useRecurringAutoApply(householdId, recurringCharges, transactions, month)

    const currentUserName = user?.displayName ?? '?'

    // ── Handlers — transactions ───────────────────────────────────────────────
    const handleAddTransaction = async (tx: Omit<Transaction, 'id'>) => {
        await addTransaction(tx)
        addLog({
            action: 'add', entityType: 'transaction', who: currentUserName, ts: Date.now(),
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
            action: 'delete', entityType: 'transaction', who: currentUserName, ts: Date.now(),
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
            action: 'edit', entityType: 'transaction', who: currentUserName, ts: Date.now(),
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
            action: 'add', entityType: 'recurring', who: currentUserName, ts: Date.now(),
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
            action: 'delete', entityType: 'recurring', who: currentUserName, ts: Date.now(),
            description: r.description, amount: r.amount, memberId: r.memberId,
        })
        showToast(t.toastRecDeleted)
    }

    // ── Handlers — members ───────────────────────────────────────────────────
    const handleAddMember = (name: string, nameEn?: string) => ctxAddMember(name, nameEn, user?.uid)

    const handleRemoveMember = async (id: string) => {
        const m = members.find((x) => x.id === id)
        if (!m) return
        const txCount = transactions.filter((tx) => tx.memberId === id).length
        const recCount = recurringCharges.filter((r) => r.memberId === id).length
        const joinSep = t.dir === 'rtl' ? ' ו-' : ' and '
        const details = [
            txCount > 0 ? t.removeMemberTxCount(txCount) : '',
            recCount > 0 ? t.removeMemberRecCount(recCount) : '',
        ].filter(Boolean).join(joinSep)
        const confirmed = await showConfirm({
            title: t.removeMemberTitle(m.name),
            sub: details
                ? t.removeMemberSub(m.name, details)
                : t.removeMemberSubSimple(m.name),
            danger: true,
        })
        if (!confirmed) return
        await Promise.all(
            transactions.filter((tx) => tx.memberId === id).map((tx) => removeTransaction(tx.id))
        )
        await Promise.all(
            recurringCharges.filter((r) => r.memberId === id).map((r) => removeRecurring(r.id))
        )
        ctxRemoveMember(id)
        if (view === `member:${id}`) setView('summary')
    }

    const handleRenameMember = (id: string, name: string, nameEn?: string) => {
        updateMember(householdId, id, { name, nameEn: (nameEn ?? null) as string | undefined })
    }

    const handleRemoveParticipant = async (uid: string) => {
        const p = participants.find((p) => p.uid === uid)
        if (!p) return
        const confirmed = await showConfirm({
            title: t.removeParticipantTitle(p.name),
            sub: t.removeParticipantSub(p.name),
            danger: true,
        })
        if (!confirmed) return
        await removeParticipant(householdId, uid)
    }

    const appReady = membersReady && txReady && recurringReady

    if (!appReady) {
        return (
            <div className="app-loading">
                <span className="app-loading-logo">
                    Home<span>Fine</span>
                </span>
            </div>
        )
    }

    return (
        <>
            <div className="wrap">
                <HeroCard
                    members={members}
                    transactions={transactions}
                    month={month}
                    onMonthChange={setMonth}
                    householdName={meta?.name}
                    currentUserId={user?.uid}
                />

                <AppNav
                    view={view}
                    members={members}
                    expensesOnly={expensesOnly}
                    onChange={setView}
                    onRemoveMember={handleRemoveMember}
                    onAddMember={() => setShowAddMember(true)}
                />

                {view === 'summary' && (
                    <SummaryView
                        transactions={transactions}
                        members={members}
                        categories={categories}
                        month={month}
                        currentUserId={user?.uid}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {view === 'expenses' && (
                    <TransactionView
                        type="expense"
                        transactions={transactions}
                        members={members}
                        categories={categories}
                        month={month}
                        currentUserId={user?.uid}
                        onAdd={handleAddTransaction}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {!expensesOnly && view === 'income' && (
                    <TransactionView
                        type="income"
                        transactions={transactions}
                        members={members}
                        categories={categories}
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
                        categories={categories}
                        month={month}
                        currentUserId={user?.uid}
                        onEdit={setEditingTx}
                        onDelete={handleDeleteTx}
                    />
                )}

                {view === 'recurring' && (
                    <RecurringSection
                        recurringCharges={recurringCharges}
                        members={members}
                        categories={categories}
                        currentUserId={user?.uid}
                        onAdd={handleAddRecurring}
                        onDelete={handleDeleteRecurring}
                    />
                )}
            </div>

            {openModal && (
                <div className="ap-modal-overlay" onClick={() => setOpenModal(null)}>
                    <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ap-modal-header">
                            <span className="ap-modal-title">
                                {openModal === 'settings' ? t.tabSettings : t.navLogs}
                            </span>
                            <button className="ap-modal-close" onClick={() => setOpenModal(null)}>✕</button>
                        </div>
                        <div className="ap-modal-body">
                            {openModal === 'settings' && (
                                <SettingsView
                                    transactions={transactions}
                                    recurringCharges={recurringCharges}
                                    logs={logs}
                                    onRemoveMember={handleRemoveMember}
                                    participants={isOwner ? participants : undefined}
                                    onRemoveParticipant={isOwner ? handleRemoveParticipant : undefined}
                                    onRenameMember={handleRenameMember}
                                />
                            )}
                            {openModal === 'logs' && <LogsSection logs={logs} onDelete={removeLog} onClear={clearLogs} />}
                        </div>
                    </div>
                </div>
            )}

            {showAddMember && (
                <AddMemberModal
                    onAdd={handleAddMember}
                    onClose={() => setShowAddMember(false)}
                    members={members}
                />
            )}

            {editingTx && (
                <EditTransactionModal
                    tx={editingTx}
                    members={members}
                    categories={categories}
                    onClose={() => setEditingTx(null)}
                    onSave={handleEditSave}
                />
            )}
        </>
    )
}
