// src/components/app/finance/SummaryView.tsx
import { useMemo } from 'react'
import { useI18n } from '../../../i18n/context'
import { useMemberName } from '../../../hooks/useMemberName'
import { Money } from '../../ui/Money'
import { TxEntry } from './TxEntry'
import type { Category, Member, Transaction } from '../../../types'

interface Props {
    transactions: Transaction[]
    members: Member[]
    categories: Category[]
    month: string
    currentUserId?: string
    onEdit: (tx: Transaction) => void
    onDelete: (tx: Transaction) => void
}

export function SummaryView({ transactions, members, categories, month, currentUserId, onEdit, onDelete }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()

    // Filter out private income that belongs to other users
    const isVisible = (tx: Transaction) => {
        if (tx.type !== 'income') return true
        const member = members.find(m => m.id === tx.memberId)
        if (!member?.privateIncome) return true
        return member.userId === currentUserId
    }

    const monthTxs = useMemo(
        () => transactions.filter((tx) => tx.date.startsWith(month) && isVisible(tx)),
        [transactions, month, members, currentUserId],
    )

    const memberStats = useMemo(
        () =>
            members.map((m) => {
                const mTxs = monthTxs.filter((tx) => tx.memberId === m.id)
                const exp = mTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
                const inc = mTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
                return { member: m, expenses: exp, income: inc, balance: inc - exp }
            }),
        [members, monthTxs],
    )

    const recent = useMemo(
        () =>
            [...monthTxs]
                .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
                .slice(0, 8),
        [monthTxs],
    )

    return (
        <div>
            {memberStats.map(({ member, expenses, income, balance }) => (
                <div key={member.id} className="summary-member-card">
                    <div
                        className="av"
                        style={{ background: member.color + '20', color: member.color }}
                    >
                        {member.name.slice(0, 2)}
                    </div>
                    <div className="summary-member-info">
                        <div className="summary-member-name">{getMemberName(member)}</div>
                        <div className="summary-member-stats">
                            <div>
                                <div className="summary-stat-lbl">{t.expenses}</div>
                                <div className="summary-stat-val" style={{ color: 'var(--red)' }}>
                                    <Money amount={expenses} />
                                </div>
                            </div>
                            <div>
                                <div className="summary-stat-lbl">{t.income}</div>
                                <div className="summary-stat-val" style={{ color: 'var(--green)' }}>
                                    <Money amount={income} />
                                </div>
                            </div>
                            <div>
                                <div className="summary-stat-lbl">{t.balance}</div>
                                <div
                                    className="summary-stat-val"
                                    style={{ color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}
                                >
                                    <Money amount={Math.abs(balance)} sign={balance < 0 ? '−' : ''} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="sec-hd">
                <span className="sec-ttl">{t.recentActivity}</span>
            </div>
            <div className="card">
                {recent.length === 0 ? (
                    <div className="empty"><p>{t.noActivity}</p></div>
                ) : (
                    recent.map((tx) => (
                        <TxEntry key={tx.id} tx={tx} members={members} categories={categories} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        </div>
    )
}
