// src/components/app/SummaryCards.tsx
import { useI18n } from '../../i18n/context'
import { Money } from '../ui/Money'
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
                <div className="ap-card-amt"><Money amount={income} sign="+" /></div>
            </div>

            <div className="ap-card ap-card--expense">
                <div className="ap-card-label">{t.expenses}</div>
                <div className="ap-card-amt"><Money amount={expenses} sign="−" /></div>
            </div>

            <div className={`ap-card ap-card--balance${balance >= 0 ? ' pos' : ' neg'}`}>
                <div className="ap-card-label">{t.balance}</div>
                <div className="ap-card-amt">
                    <Money amount={Math.abs(balance)} sign={balance >= 0 ? '+' : '−'} />
                </div>
            </div>
        </div>
    )
}
