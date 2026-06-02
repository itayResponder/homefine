// src/pages/AppPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { useTransactions } from '../hooks/useTransactions'
import { useRecurring } from '../hooks/useRecurring'
import { useLogs } from '../hooks/useLogs'
import { usePresence } from '../hooks/usePresence'
import { useI18n } from '../i18n/context'
import { useToast } from '../contexts/ui'
import { useConfirm } from '../contexts/ui'
import { AppHeader } from '../components/app/AppHeader'
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
import { AddMemberModal } from '../components/app/AddMemberModal'
import { currentMonth } from '../utils/date'
import { applyRecurring } from '../utils/recurring'
import { approveJoinRequest, denyJoinRequest, seedParticipant, subscribeParticipants, removeParticipant, subscribeUserMembership, leaveHousehold } from '../firebase/db'
import type { Participant } from '../types'
import { useUserColor } from '../hooks/useUserColor'
import { useHouseholdMeta } from '../hooks/useHouseholdMeta'
import { useJoinRequests } from '../hooks/useJoinRequests'
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
    const { householdId = '' } = useParams<{ householdId: string }>()
    const { user, logout } = useAuth()
    const { members, ready: membersReady, add: addMember, remove: removeMember } = useMembers(householdId)
    const { transactions, ready: txReady, add: addTransaction, remove: removeTransaction, update: updateTransaction } = useTransactions(householdId)
    const { recurringCharges, ready: recurringReady, add: addRecurring, remove: removeRecurring } = useRecurring(householdId)
    const { logs, add: addLog, remove: removeLog, clear: clearLogs } = useLogs(householdId)
    const online = usePresence(householdId, user)
    const { t } = useI18n()
    const { showToast } = useToast()
    const { showConfirm } = useConfirm()
    const { color: primaryColor, loading: colorLoading, updateColor } = useUserColor(user?.uid)
    const { meta, isOwner, expensesOnly, updateSettings, renameMeta, toggleMemberIncome } = useHouseholdMeta(householdId, user?.uid)

    // Join requests — only subscribed when user is owner
    const ownedEntry = isOwner && meta ? [{ id: householdId, name: meta.name }] : []
    const joinRequests = useJoinRequests(ownedEntry)

    // Kick user out if they lose household membership (removed by owner or direct URL access without permission)
    const membershipInitRef = useRef(false)
    useEffect(() => {
        if (!user) return
        membershipInitRef.current = false
        return subscribeUserMembership(householdId, user.uid, (isMember) => {
            if (!membershipInitRef.current) {
                membershipInitRef.current = true
                if (!isMember) navigate('/dashboard', { replace: true })
            } else if (!isMember) {
                navigate('/dashboard', { replace: true })
            }
        })
    }, [user?.uid, householdId])

    // Participants — only subscribed and seeded when user is owner
    const [participants, setParticipants] = useState<Participant[]>([])
    useEffect(() => {
        if (!isOwner || !householdId) return
        return subscribeParticipants(householdId, setParticipants)
    }, [isOwner, householdId])

    useEffect(() => {
        if (!user || !meta) return
        seedParticipant(householdId, user.uid, {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            joinedAt: meta.createdAt,
        }).catch(() => { /* member may load before meta propagates — safe to ignore */ })
    }, [!!meta, user?.uid])

    // ── UI state ──────────────────────────────────────────────────────────────
    const [view, setView] = useState('summary')
    const [month, setMonth] = useState(currentMonth)
    const [editingTx, setEditingTx] = useState<Transaction | null>(null)
    const [modal, setModal] = useState<'settings' | 'logs' | null>(null)
    const [showAddMember, setShowAddMember] = useState(false)

    // ── Auto-apply recurring charges ──────────────────────────────────────────
    const txRef = useRef(transactions)
    useEffect(() => { txRef.current = transactions }, [transactions])

    const applyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        if (applyTimerRef.current) clearTimeout(applyTimerRef.current)
        applyTimerRef.current = setTimeout(() => {
            const [year, m] = month.split('-').map(Number)
            applyRecurring(householdId, recurringCharges, txRef.current, year, m - 1)
        }, 600)
        return () => {
            if (applyTimerRef.current) clearTimeout(applyTimerRef.current)
        }
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

    const handleApproveJoin = async (hId: string, uid: string) => {
        const request = joinRequests.find(r => r.householdId === hId && r.uid === uid)
        await approveJoinRequest(hId, uid, request ? { name: request.name, email: request.email, photoURL: request.photoURL } : undefined)
    }

    const handleRemoveParticipant = async (uid: string) => {
        const p = participants.find(p => p.uid === uid)
        if (!p) return
        const confirmed = await showConfirm({
            title: `הסרת ${p.name}`,
            sub: `להסיר את ${p.name} מהגישה לבית? הנתונים שלהם יישמרו.`,
            danger: true,
        })
        if (!confirmed) return
        await removeParticipant(householdId, uid)
    }

    const handleLeaveHousehold = async () => {
        if (!user) return
        const confirmed = await showConfirm({
            title: t.dir === 'rtl' ? 'עזיבת הבית' : 'Leave household',
            sub: t.dir === 'rtl' ? 'בטוח שאתה רוצה לעזוב? תאבד את הגישה לבית.' : 'Are you sure you want to leave? You will lose access.',
            danger: true,
        })
        if (!confirmed) return
        await leaveHousehold(householdId, user.uid)
        navigate('/dashboard')
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const appReady = !colorLoading && membersReady && txReady && recurringReady

    if (!appReady) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', opacity: 0.6 }}>
                    Home<span style={{ color: '#2563EB' }}>Fine</span>
                </span>
            </div>
        )
    }

    return (
        <div className="ap-root" style={buildColorVars(primaryColor) as React.CSSProperties}>
            <AppHeader
                user={user}
                householdId={householdId}
                onLogout={handleLogout}
                onOpenSettings={() => setModal('settings')}
                onOpenLogs={() => setModal('logs')}
                onDashboard={() => navigate('/dashboard')}
                joinRequests={isOwner ? joinRequests : []}
                onApproveJoin={isOwner ? handleApproveJoin : undefined}
                onDenyJoin={isOwner ? denyJoinRequest : undefined}
                onLeave={!isOwner ? handleLeaveHousehold : undefined}
                online={online}
            />


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
                        month={month}
                        currentUserId={user?.uid}
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

                {!expensesOnly && view === 'income' && (
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
                        currentUserId={user?.uid}
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
                                onRemoveMember={handleRemoveMember}
                                primaryColor={primaryColor}
                                onColorChange={updateColor}
                                isOwner={isOwner}
                                meta={meta}
                                onUpdateSettings={updateSettings}
                                onRename={renameMeta}
                                currentUserId={user?.uid}
                                onToggleMemberIncome={toggleMemberIncome}
                                participants={isOwner ? participants : undefined}
                                onRemoveParticipant={isOwner ? handleRemoveParticipant : undefined}
                            />
                        )}
                        {modal === 'logs' && <LogsSection logs={logs} onDelete={removeLog} onClear={clearLogs} />}
                    </div>
                </div>
            )}

            {showAddMember && (
                <AddMemberModal
                    onAdd={handleAddMember}
                    onClose={() => setShowAddMember(false)}
                />
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
