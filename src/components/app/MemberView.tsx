// src/components/app/MemberView.tsx
import { useMemo } from 'react'
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'
import { TxEntry } from './TxEntry'
import type { Member, Transaction } from '../../types'

interface Props {
    memberId: string
    transactions: Transaction[]
    members: Member[]
    month: string
    onEdit: (tx: Transaction) => void
    onDelete: (tx: Transaction) => void
}

export function MemberView({ memberId, transactions, members, month, onEdit, onDelete }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()
    const member = members.find((m) => m.id === memberId)

    const memberTxs = useMemo(
        () => transactions.filter((tx) => tx.memberId === memberId && tx.date.startsWith(month)),
        [transactions, memberId, month],
    )

    const expenses = useMemo(
        () =>
            memberTxs
                .filter((tx) => tx.type === 'expense')
                .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
        [memberTxs],
    )
    const income = useMemo(
        () =>
            memberTxs
                .filter((tx) => tx.type === 'income')
                .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
        [memberTxs],
    )

    const totalExp = expenses.reduce((s, tx) => s + tx.amount, 0)
    const totalInc = income.reduce((s, tx) => s + tx.amount, 0)
    const balance = totalInc - totalExp

    if (!member) return null
    const name = getMemberName(member)

    return (
        <div>
            <div className="pstats">
                <div className="pstat">
                    <div className="pstat-lbl">{t.income}</div>
                    <div className="pstat-val pos">₪{totalInc.toLocaleString()}</div>
                </div>
                <div className="pstat">
                    <div className="pstat-lbl">{t.expenses}</div>
                    <div className="pstat-val neg">₪{totalExp.toLocaleString()}</div>
                </div>
                <div className="pstat">
                    <div className="pstat-lbl">{t.balance}</div>
                    <div className={`pstat-val ${balance >= 0 ? 'pos' : 'neg'}`}>
                        ₪{Math.abs(balance).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="sec-hd">
                <span className="sec-ttl">{t.memberExpensesTitle(name)}</span>
            </div>
            <div className="card">
                {expenses.length === 0 ? (
                    <div className="empty"><p>{t.noMemberExpenses(name)}</p></div>
                ) : (
                    expenses.map((tx) => (
                        <TxEntry key={tx.id} tx={tx} members={members} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>

            <div className="sec-hd">
                <span className="sec-ttl">{t.memberIncomeTitle(name)}</span>
            </div>
            <div className="card">
                {income.length === 0 ? (
                    <div className="empty"><p>{t.noMemberIncome(name)}</p></div>
                ) : (
                    income.map((tx) => (
                        <TxEntry key={tx.id} tx={tx} members={members} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        </div>
    )
}
