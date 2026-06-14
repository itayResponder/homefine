// src/components/app/EditTransactionModal.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'
import { CustomSelect } from '../ui/CustomSelect'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { AmountInput } from '../ui/AmountInput'
import { CategorySelect } from '../ui/CategorySelect'
import type { Category, Member, Transaction, TransactionType } from '../../types'
import './AddTransactionModal.css'

interface Props {
    tx: Transaction
    members: Member[]
    categories: Category[]
    onClose: () => void
    onSave: (id: string, changes: Partial<Transaction>) => Promise<void>
    onAddCategory: (cat: Omit<Category, 'id'>) => Promise<string>
    onUpdateCategory?: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDeleteCategory?: (id: string) => Promise<void>
}

interface FormState {
    type: TransactionType
    amount: string
    description: string
    category: string
    memberId: string
    date: string
}

export function EditTransactionModal({ tx, members, categories, onClose, onSave, onAddCategory, onUpdateCategory, onDeleteCategory }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()
    const [form, setForm] = useState<FormState>({
        type: tx.type,
        amount: String(tx.amount),
        description: tx.description,
        category: tx.category,
        memberId: tx.memberId,
        date: tx.date,
    })

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((f) => ({ ...f, [key]: value }))

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        if (!amount || !form.description.trim()) return
        await onSave(tx.id, {
            type: form.type, amount, description: form.description.trim(),
            category: form.category, memberId: form.memberId, date: form.date,
        })
    }

    const memberOpts = [
        { value: 'shared', label: t.shared },
        ...members.map((m) => ({ value: m.id, label: getMemberName(m) })),
    ]

    return (
        <div className="ap-overlay" onClick={onClose}>
            <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <h2>{t.editTransactionTitle}</h2>
                    <button onClick={onClose} className="ap-modal-close" aria-label="Close">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="ap-modal-form">
                    {/* Type */}
                    <div className="ap-form-row">
                        <label>{t.typeLabel}</label>
                        <div className="ap-type-toggle">
                            <button type="button" className={`ap-type-btn${form.type === 'expense' ? ' active-expense' : ''}`} onClick={() => set('type', 'expense')}>
                                {t.expenseLabel}
                            </button>
                            <button type="button" className={`ap-type-btn${form.type === 'income' ? ' active-income' : ''}`} onClick={() => set('type', 'income')}>
                                {t.incomeLabel}
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="ap-form-row">
                        <label>{t.amountLabel}</label>
                        <AmountInput className="ap-input" value={form.amount} onChange={(v) => set('amount', v)} required />
                    </div>

                    {/* Description */}
                    <div className="ap-form-row">
                        <label>{t.descriptionLabel}</label>
                        <input type="text" className="ap-input" value={form.description} onChange={(e) => set('description', e.target.value)} required />
                    </div>

                    {/* Category */}
                    <div className="ap-form-row">
                        <label>{t.categoryLabel}</label>
                        <CategorySelect
                            categories={categories}
                            value={form.category}
                            onChange={(v) => set('category', v)}
                            onAddCategory={onAddCategory}
                            onUpdateCategory={onUpdateCategory}
                            onDeleteCategory={onDeleteCategory}
                        />
                    </div>

                    {/* Who */}
                    <div className="ap-form-row">
                        <label>{t.whoLabel}</label>
                        <CustomSelect options={memberOpts} value={form.memberId} onChange={(v) => set('memberId', v)} />
                    </div>

                    {/* Date */}
                    <div className="ap-form-row">
                        <label>{t.dateLabel}</label>
                        <CustomDatePicker value={form.date} onChange={(v) => set('date', v)} />
                    </div>

                    <button type="submit" className="ap-submit-btn">{t.saveChanges}</button>
                </form>
            </div>
        </div>
    )
}
