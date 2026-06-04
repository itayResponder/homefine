// src/components/app/TransactionList.tsx
import { useI18n } from '../../i18n/context'
import { getCatIcon, getCatName } from '../../utils/categories'
import { Money } from '../ui/Money'
import type { Category, Transaction } from '../../types'
import './TransactionList.css'

interface ListProps {
    transactions: Transaction[]
    tabName: string
    monthLabel: string
    activeColor: string
    categories: Category[]
    onDelete: (tx: Transaction) => void
    onEdit: (tx: Transaction) => void
    onAddClick: () => void
}

export function TransactionList({
    transactions,
    tabName,
    monthLabel,
    activeColor,
    categories,
    onDelete,
    onEdit,
    onAddClick,
}: ListProps) {
    const { t } = useI18n()

    return (
        <div className="ap-tx-section">
            <div className="ap-tx-header">
                <span className="ap-tx-title">
                    {tabName} · {monthLabel}
                </span>
                <button
                    onClick={onAddClick}
                    className="ap-add-tx-btn"
                    style={{ background: activeColor }}
                >
                    + {t.add}
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="ap-empty">
                    <span className="ap-empty-icon">📭</span>
                    <p>
                        {t.noActivity} — {tabName} {monthLabel}
                    </p>
                    <button
                        onClick={onAddClick}
                        className="ap-empty-cta"
                        style={{ color: activeColor, borderColor: activeColor }}
                    >
                        {t.add}
                    </button>
                </div>
            ) : (
                <div className="ap-tx-list">
                    {transactions.map((tx) => (
                        <TransactionItem
                            key={tx.id}
                            tx={tx}
                            categories={categories}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface ItemProps {
    tx: Transaction
    categories: Category[]
    onDelete: (tx: Transaction) => void
    onEdit: (tx: Transaction) => void
}

function TransactionItem({ tx, categories, onDelete, onEdit }: ItemProps) {
    const { t } = useI18n()
    const isExpense = tx.type === 'expense'
    const isRecurring = Boolean(tx.recurringId)

    return (
        <div className="ap-tx">
            <div className="ap-tx-left">
                <div
                    className="ap-tx-icon"
                    style={{
                        background: isExpense ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    }}
                >
                    {getCatIcon(categories, tx.category)}
                </div>
                <div>
                    <div className="ap-tx-desc">{tx.description}</div>
                    <div className="ap-tx-sub">
                        {getCatName(categories, tx.category, t.locale)} · {tx.date}
                        {isRecurring && (
                            <span className="ap-tx-rec-badge">{t.recurringBadge}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="ap-tx-right">
                <div className={`ap-tx-amt ${isExpense ? 'neg' : 'pos'}`}>
                    <Money amount={tx.amount} sign={isExpense ? '−' : '+'} />
                </div>

                {isRecurring ? (
                    <div className="ap-tx-rec-spacer" />
                ) : (
                    <>
                        <button
                            onClick={() => onEdit(tx)}
                            className="ap-tx-edit"
                            aria-label="Edit transaction"
                        >
                            ✏
                        </button>
                        <button
                            onClick={() => onDelete(tx)}
                            className="ap-tx-delete"
                            aria-label="Delete transaction"
                        >
                            ✕
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
