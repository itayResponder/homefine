// src/components/app/IncomeView.tsx
import { useState, useMemo } from 'react'
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'
import { todayISO } from '../../utils/date'
import { CustomSelect } from '../ui/CustomSelect'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { TxEntry } from './TxEntry'
import type { Member, Transaction, TransactionCategory } from '../../types'

interface Props {
    transactions: Transaction[]
    members: Member[]
    month: string
    onAdd: (tx: Omit<Transaction, 'id'>) => Promise<void>
    onDelete: (tx: Transaction) => void
    onEdit: (tx: Transaction) => void
}

export function IncomeView({ transactions, members, month, onAdd, onDelete, onEdit }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()
    const [desc, setDesc] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState<TransactionCategory>('salary')
    const [memberId, setMemberId] = useState('shared')
    const [date, setDate] = useState(todayISO)

    const monthIncome = useMemo(
        () =>
            transactions
                .filter((tx) => tx.type === 'income' && tx.date.startsWith(month))
                .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
        [transactions, month],
    )
    const total = useMemo(() => monthIncome.reduce((s, tx) => s + tx.amount, 0), [monthIncome])

    const categoryOpts = Object.entries(t.categoryOptions).map(([k, v]) => ({ value: k, label: v }))
    const memberOpts = [
        { value: 'shared', label: t.shared },
        ...members.map((m) => ({ value: m.id, label: getMemberName(m) })),
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amt = parseFloat(amount)
        if (!amt || !desc.trim()) return
        await onAdd({
            type: 'income', amount: amt, description: desc.trim(),
            category, memberId, date, createdAt: Date.now(),
        })
        setDesc('')
        setAmount('')
        setDate(todayISO())
    }

    return (
        <div>
            <div className="fcard">
                <div className="fttl">{t.newIncomeTitle}</div>
                <form onSubmit={handleSubmit}>
                    <div className="fg fg2">
                        <div className="fl">
                            <label>{t.descriptionLabel}</label>
                            <input className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.incomePlaceholder} required />
                        </div>
                        <div className="fl">
                            <label>{t.amountLabel}</label>
                            <input type="number" min="0" step="0.01" className="inp" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
                        </div>
                    </div>
                    <div className="fg fg3">
                        <div className="fl">
                            <label>{t.categoryLabel}</label>
                            <CustomSelect options={categoryOpts} value={category} onChange={(v) => setCategory(v as TransactionCategory)} />
                        </div>
                        <div className="fl">
                            <label>{t.whoLabel}</label>
                            <CustomSelect options={memberOpts} value={memberId} onChange={setMemberId} />
                        </div>
                        <div className="fl">
                            <label>{t.dateLabel}</label>
                            <CustomDatePicker value={date} onChange={setDate} />
                        </div>
                    </div>
                    <button type="submit" className="sbtn">{t.addIncomeBtn}</button>
                </form>
            </div>

            <div className="sec-hd">
                <span className="sec-ttl">{t.incomeThisMonth}</span>
                {total > 0 && <span className="badge pos">+₪{total.toLocaleString()}</span>}
            </div>
            <div className="card">
                {monthIncome.length === 0 ? (
                    <div className="empty"><p>{t.noIncome}</p></div>
                ) : (
                    monthIncome.map((tx) => (
                        <TxEntry key={tx.id} tx={tx} members={members} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        </div>
    )
}
