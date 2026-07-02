// src/components/app/finance/TransactionView.tsx
import { useState, useMemo } from 'react'
import { useI18n } from '../../../i18n/context'
import { useMemberName } from '../../../hooks/useMemberName'
import { todayISO, isInFinanceCycle } from '../../../utils/date'
import { getDefaultMemberId } from '../../../utils/members'
import { CustomSelect } from '../../ui/CustomSelect'
import { CustomDatePicker } from '../../ui/CustomDatePicker'
import { AmountInput } from '../../ui/AmountInput'
import { Money } from '../../ui/Money'
import { CategorySelect } from '../../ui/CategorySelect'
import { TxEntry } from './TxEntry'
import type { Category, Member, Transaction } from '../../../types'

interface Props {
    type: 'expense' | 'income'
    transactions: Transaction[]
    members: Member[]
    categories: Category[]
    month: string
    currentUserId?: string
    onAdd: (tx: Omit<Transaction, 'id'>) => Promise<void>
    onDelete: (tx: Transaction) => void
    onEdit: (tx: Transaction) => void
    onAddCategory: (cat: Omit<Category, 'id'>) => Promise<string>
    onUpdateCategory?: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDeleteCategory?: (id: string) => Promise<void>
}

export function TransactionView({ type, transactions, members, categories, month, currentUserId, onAdd, onDelete, onEdit, onAddCategory, onUpdateCategory, onDeleteCategory }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()
    const [desc, setDesc] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [memberId, setMemberId] = useState<string | null>(null)
    const [date, setDate] = useState(todayISO)
    const [errors, setErrors] = useState<{ desc?: string; amount?: string; category?: string }>({})

    const isExpense = type === 'expense'

    const defaultMemberId = getDefaultMemberId(members, currentUserId)
    const effectiveMemberId = memberId ?? defaultMemberId

    const monthTxs = useMemo(
        () =>
            transactions
                .filter((tx) => tx.type === type && isInFinanceCycle(tx.date, tx.type, month))
                .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
        [transactions, type, month],
    )
    const total = useMemo(() => monthTxs.reduce((s, tx) => s + tx.amount, 0), [monthTxs])

    const memberOpts = [
        { value: 'shared', label: t.shared },
        ...members.map((m) => ({ value: m.id, label: getMemberName(m) })),
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amt = parseFloat(amount)
        const newErrors = {
            desc: !desc.trim() ? t.fieldRequired : undefined,
            amount: (!amount || !amt || amt <= 0) ? t.amountRequired : undefined,
            category: !category ? t.categoryRequired : undefined,
        }
        if (newErrors.desc || newErrors.amount || newErrors.category) {
            setErrors(newErrors)
            return
        }
        await onAdd({
            type, amount: amt, description: desc.trim(),
            category, memberId: effectiveMemberId, date, createdAt: Date.now(),
        })
        setDesc('')
        setAmount('')
        setCategory('')
        setMemberId(null)
        setDate(todayISO())
        setErrors({})
    }

    return (
        <div>
            <div className="fcard">
                <div className="fttl">{isExpense ? t.newExpenseTitle : t.newIncomeTitle}</div>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="fg fg2">
                        <div className="fl">
                            <label>{t.descriptionLabel}</label>
                            <input
                                className={`inp${errors.desc ? ' inp--error' : ''}`}
                                value={desc}
                                onChange={(e) => { setDesc(e.target.value); setErrors(prev => ({ ...prev, desc: undefined })) }}
                                placeholder={isExpense ? t.expensePlaceholder : t.incomePlaceholder}
                            />
                            {errors.desc && <span className="field-error">{errors.desc}</span>}
                        </div>
                        <div className="fl">
                            <label>{t.amountLabel}</label>
                            <AmountInput
                                className={`inp${errors.amount ? ' inp--error' : ''}`}
                                value={amount}
                                onChange={(v) => { setAmount(v); setErrors(prev => ({ ...prev, amount: undefined })) }}
                                placeholder="0"
                            />
                            {errors.amount && <span className="field-error">{errors.amount}</span>}
                        </div>
                    </div>
                    <div className="fg fg3">
                        <div className="fl">
                            <label>{t.categoryLabel}</label>
                            <CategorySelect
                                categories={categories}
                                value={category}
                                onChange={(v) => { setCategory(v); setErrors(prev => ({ ...prev, category: undefined })) }}
                                onAddCategory={onAddCategory}
                                onUpdateCategory={onUpdateCategory}
                                onDeleteCategory={onDeleteCategory}
                                error={!!errors.category}
                            />
                            {errors.category && <span className="field-error">{errors.category}</span>}
                        </div>
                        <div className="fl">
                            <label>{t.whoLabel}</label>
                            <CustomSelect options={memberOpts} value={effectiveMemberId} onChange={setMemberId} />
                        </div>
                        <div className="fl">
                            <label>{t.dateLabel}</label>
                            <CustomDatePicker value={date} onChange={setDate} />
                        </div>
                    </div>
                    <button type="submit" className="sbtn">{isExpense ? t.addExpenseBtn : t.addIncomeBtn}</button>
                </form>
            </div>

            <div className="sec-hd">
                <span className="sec-ttl">{isExpense ? t.expensesThisMonth : t.incomeThisMonth}</span>
                {total > 0 && <span className={`badge ${isExpense ? 'neg' : 'pos'}`}><Money amount={total} sign={isExpense ? '−' : '+'} /></span>}
            </div>
            <div className="card">
                {monthTxs.length === 0 ? (
                    <div className="empty"><p>{isExpense ? t.noExpenses : t.noIncome}</p></div>
                ) : (
                    monthTxs.map((tx) => (
                        <TxEntry key={tx.id} tx={tx} members={members} categories={categories} onEdit={onEdit} onDelete={onDelete} />
                    ))
                )}
            </div>
        </div>
    )
}
