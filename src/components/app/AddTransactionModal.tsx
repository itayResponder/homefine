// src/components/app/AddTransactionModal.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { todayISO } from '../../utils/date'
import { AmountInput } from '../ui/AmountInput'
import type { Member, Transaction, TransactionCategory, TransactionType } from '../../types'
import './AddTransactionModal.css'

interface Props {
    members: Member[]
    defaultMemberId: string
    onClose: () => void
    onSubmit: (tx: Omit<Transaction, 'id'>) => Promise<void>
}

interface FormState {
    type: TransactionType
    amount: string
    description: string
    category: TransactionCategory
    memberId: string
    date: string
}

function buildInitialForm(defaultMemberId: string): FormState {
    return {
        type: 'expense',
        amount: '',
        description: '',
        category: 'other',
        memberId: defaultMemberId,
        date: todayISO(),
    }
}

export function AddTransactionModal({ members, defaultMemberId, onClose, onSubmit }: Props) {
    const { t } = useI18n()
    const [form, setForm] = useState<FormState>(() => buildInitialForm(defaultMemberId))

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((f) => ({ ...f, [key]: value }))

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        if (!amount || !form.description.trim()) return
        await onSubmit({
            type: form.type,
            amount,
            description: form.description.trim(),
            category: form.category,
            memberId: form.memberId,
            date: form.date,
            createdAt: Date.now(),
        })
        onClose()
    }

    const categories = Object.entries(t.categoryOptions) as [TransactionCategory, string][]

    return (
        <div className="ap-overlay" onClick={onClose}>
            <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <h2>{t.addTransactionTitle}</h2>
                    <button onClick={onClose} className="ap-modal-close" aria-label="Close">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="ap-modal-form">
                    {/* Type */}
                    <div className="ap-form-row">
                        <label>{t.typeLabel}</label>
                        <div className="ap-type-toggle">
                            <button
                                type="button"
                                className={`ap-type-btn${form.type === 'expense' ? ' active-expense' : ''}`}
                                onClick={() => set('type', 'expense')}
                            >
                                {t.expenseLabel}
                            </button>
                            <button
                                type="button"
                                className={`ap-type-btn${form.type === 'income' ? ' active-income' : ''}`}
                                onClick={() => set('type', 'income')}
                            >
                                {t.incomeLabel}
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="ap-form-row">
                        <label>{t.amountLabel}</label>
                        <AmountInput
                            className="ap-input"
                            value={form.amount}
                            onChange={(v) => set('amount', v)}
                            placeholder="0"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="ap-form-row">
                        <label>{t.descriptionLabel}</label>
                        <input
                            type="text"
                            className="ap-input"
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            required
                            placeholder={t.descriptionPlaceholder}
                        />
                    </div>

                    {/* Category */}
                    <div className="ap-form-row">
                        <label>{t.categoryLabel}</label>
                        <select
                            className="ap-input"
                            value={form.category}
                            onChange={(e) => set('category', e.target.value as TransactionCategory)}
                        >
                            {categories.map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Who */}
                    <div className="ap-form-row">
                        <label>{t.whoLabel}</label>
                        <select
                            className="ap-input"
                            value={form.memberId}
                            onChange={(e) => set('memberId', e.target.value)}
                        >
                            <option value="shared">{t.shared}</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div className="ap-form-row">
                        <label>{t.dateLabel}</label>
                        <input
                            type="date"
                            className="ap-input"
                            value={form.date}
                            onChange={(e) => set('date', e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="ap-submit-btn">
                        {t.submitBtn}
                    </button>
                </form>
            </div>
        </div>
    )
}
