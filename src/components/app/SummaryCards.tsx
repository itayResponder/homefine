// src/components/app/SummaryCards.tsx
import { useI18n } from '../../i18n/context'
import './SummaryCards.css'

interface Props {
    income: number
    expenses: number
    balance: number
}

export function SummaryCards({ income, expenses, balance }: Props) {
    const { t } = useI18n()

    return (
        <div className="ap-summary">
            <div className="ap-card ap-card--income">
                <div className="ap-card-label">{t.income}</div>
                <div className="ap-card-amt">+₪{income.toLocaleString()}</div>
            </div>

            <div className="ap-card ap-card--expense">
                <div className="ap-card-label">{t.expenses}</div>
                <div className="ap-card-amt">−₪{expenses.toLocaleString()}</div>
            </div>

            <div className={`ap-card ap-card--balance${balance >= 0 ? ' pos' : ' neg'}`}>
                <div className="ap-card-label">{t.balance}</div>
                <div className="ap-card-amt">
                    {balance >= 0 ? '+' : '−'}₪{Math.abs(balance).toLocaleString()}
                </div>
            </div>
        </div>
    )
}
