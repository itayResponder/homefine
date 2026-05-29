// src/components/app/RecurringSection.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'
import { todayISO } from '../../utils/date'
import { computeStartYearMonth } from '../../utils/recurring'
import { CATEGORY_ICONS } from '../../constants/categories'
import { CustomSelect } from '../ui/CustomSelect'
import { CustomDatePicker } from '../ui/CustomDatePicker'
import { Money } from '../ui/Money'
import type { Member, RecurringCharge, TransactionCategory, TransactionType } from '../../types'
import './RecurringSection.css'

interface Props {
    recurringCharges: RecurringCharge[]
    members: Member[]
    currentUserId?: string
    onAdd: (charge: Omit<RecurringCharge, 'id'>) => void
    onDelete: (r: RecurringCharge) => void
}

interface FormState {
    type: TransactionType
    description: string
    amount: string
    category: TransactionCategory
    memberId: string
    startDate: string
    monthCount: string
}

export function RecurringSection({ recurringCharges, members, currentUserId, onAdd, onDelete }: Props) {
    const { t } = useI18n()

    const defaultMemberId = () =>
        members.find((m) => m.userId === currentUserId)?.id ?? 'shared'

    const emptyForm = (): FormState => ({
        type: 'expense',
        description: '',
        amount: '',
        category: '' as TransactionCategory,
        memberId: defaultMemberId(),
        startDate: todayISO(),
        monthCount: '1',
    })

    const [form, setForm] = useState<FormState>(emptyForm)

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((f) => ({ ...f, [key]: value }))

    const handleSubmit = (e: { preventDefault(): void }) => {
        e.preventDefault()
        const amount = parseFloat(form.amount)
        const monthCount = parseInt(form.monthCount)
        if (!amount || !form.description.trim() || !form.category || !monthCount || monthCount < 1) return

        const dayOfMonth = new Date(form.startDate).getDate()
        const startYearMonth = computeStartYearMonth(form.startDate)

        onAdd({
            type: form.type,
            description: form.description.trim(),
            amount,
            category: form.category,
            memberId: form.memberId,
            dayOfMonth,
            startYearMonth,
            monthCount,
            active: true,
        })
        setForm(emptyForm())
    }

    const getMemberName = useMemberName()
    const categoryOpts = Object.entries(t.categoryOptions).map(([k, v]) => ({ value: k, label: v }))
    const memberOpts = [
        { value: 'shared', label: t.shared },
        ...members.map((m) => ({ value: m.id, label: getMemberName(m) })),
    ]

    const monthCountLabel = t.dir === 'rtl' ? 'כמות חודשים' : 'Number of months'
    const monthCountPlaceholder = t.dir === 'rtl' ? 'מס׳ חודשים' : 'Count'

    return (
        <div className="rec-section">
            {/* ── Add form ── */}
            <div className="rec-form-card">
                <div className="rec-form-title">{t.newRecurringTitle}</div>

                {/* Type toggle */}
                <div className="rec-type-toggle">
                    <button
                        type="button"
                        className={`rec-type-btn${form.type === 'expense' ? ' active' : ''}`}
                        onClick={() => setField('type', 'expense')}
                    >
                        {t.recurringExpense}
                    </button>
                    <button
                        type="button"
                        className={`rec-type-btn${form.type === 'income' ? ' active' : ''}`}
                        onClick={() => setField('type', 'income')}
                    >
                        {t.recurringIncome}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="rec-form-grid">
                    <div className="rec-field">
                        <label>{t.descriptionLabel}</label>
                        <input
                            className="ap-input"
                            value={form.description}
                            onChange={(e) => setField('description', e.target.value)}
                            placeholder={t.descriptionPlaceholder}
                            required
                        />
                    </div>
                    <div className="rec-field">
                        <label>{t.amountLabel}</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="ap-input"
                            value={form.amount}
                            onChange={(e) => setField('amount', e.target.value)}
                            placeholder="0"
                            required
                        />
                    </div>
                    <div className="rec-field">
                        <label>{t.categoryLabel}</label>
                        <CustomSelect
                            options={categoryOpts}
                            value={form.category}
                            onChange={(v) => setField('category', v as TransactionCategory)}
                            placeholder={t.categoryLabel}
                        />
                    </div>
                    <div className="rec-field">
                        <label>{t.whoLabel}</label>
                        <CustomSelect
                            options={memberOpts}
                            value={form.memberId}
                            onChange={(v) => setField('memberId', v)}
                        />
                    </div>
                    <div className="rec-field">
                        <label>{t.dateLabel}</label>
                        <CustomDatePicker value={form.startDate} onChange={(v) => setField('startDate', v)} />
                    </div>
                    <div className="rec-field">
                        <label>{monthCountLabel}</label>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            className="ap-input"
                            value={form.monthCount}
                            onChange={(e) => setField('monthCount', e.target.value)}
                            placeholder={monthCountPlaceholder}
                            required
                        />
                    </div>
                    <button type="submit" className="rec-submit-btn">
                        {form.type === 'expense' ? t.recurringExpense : t.recurringIncome} +
                    </button>
                </form>
            </div>

            {/* ── Active list ── */}
            <div className="rec-list-header">
                <span className="rec-list-title">{t.activeChargesTitle}</span>
                {recurringCharges.length > 0 && (
                    <span className="rec-count">{recurringCharges.length}</span>
                )}
            </div>

            {recurringCharges.length === 0 ? (
                <div className="rec-empty">
                    <span className="rec-empty-icon">🔁</span>
                    <p>{t.noRecurring}</p>
                </div>
            ) : (
                <div className="rec-list">
                    {recurringCharges.map((r) => (
                        <RecurringItem
                            key={r.id}
                            r={r}
                            members={members}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface ItemProps {
    r: RecurringCharge
    members: Member[]
    onDelete: (r: RecurringCharge) => void
}

function formatYearMonth(ym: string, day: number, monthNames: string[]): string {
    const [y, m] = ym.split('-').map(Number)
    return `${day} ${monthNames[m - 1]} ${y}`
}

function RecurringItem({ r, members, onDelete }: ItemProps) {
    const { t } = useI18n()
    const getMemberName = useMemberName()
    const isIncome = r.type === 'income'
    const found = members.find((m) => m.id === r.memberId)
    const memberName =
        r.memberId === 'shared'
            ? t.sharedLabel
            : (found ? getMemberName(found) : r.memberId)

    const rangeLabel = (() => {
        if (!r.startYearMonth || !r.monthCount) {
            return t.dir === 'rtl' ? `יום ${r.dayOfMonth}` : `Day ${r.dayOfMonth}`
        }
        const [sy, sm] = r.startYearMonth.split('-').map(Number)
        const total = sy * 12 + (sm - 1) + r.monthCount - 1
        const ey = Math.floor(total / 12)
        const em = (total % 12) + 1
        const endYearMonth = `${ey}-${String(em).padStart(2, '0')}`
        return r.startYearMonth === endYearMonth
            ? formatYearMonth(r.startYearMonth, r.dayOfMonth, t.monthNamesShort)
            : `${formatYearMonth(r.startYearMonth, r.dayOfMonth, t.monthNamesShort)} → ${formatYearMonth(endYearMonth, r.dayOfMonth, t.monthNamesShort)}`
    })()

    return (
        <div className="rec-item">
            <div
                className="rec-item-icon"
                style={{ background: isIncome ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}
            >
                {CATEGORY_ICONS[r.category]}
            </div>
            <div className="rec-item-info">
                <div className="rec-item-name">{r.description}</div>
                <div className="rec-item-meta">
                    <span className="rec-item-who">{memberName}</span>
                    <span>·</span>
                    <span>{t.categoryNames[r.category]}</span>
                    <span className="rec-day-badge">{rangeLabel}</span>
                </div>
            </div>
            <span className={`rec-item-amt ${isIncome ? 'pos' : 'neg'}`}>
                <Money amount={r.amount} sign={isIncome ? '+' : '−'} />
            </span>
            <button
                className="rec-item-delete"
                onClick={() => onDelete(r)}
                aria-label="Delete recurring charge"
            >
                ✕
            </button>
        </div>
    )
}
