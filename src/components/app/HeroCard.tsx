// src/components/app/HeroCard.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'
import { fmt } from '../../utils/format'
import type { Member, Transaction } from '../../types'

interface Props {
    members: Member[]
    transactions: Transaction[]
    month: string   // YYYY-MM
    onMonthChange: (month: string) => void
}

export function HeroCard({ members, transactions, month, onMonthChange }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()

    const [year, monthIdx0] = month.split('-').map((n, i) => i === 1 ? Number(n) - 1 : Number(n))
    const [open, setOpen] = useState(false)
    const [navYear, setNavYear] = useState(year)

    const monthlyTxs = transactions.filter((tx) => tx.date.startsWith(month))

    const totalIncome = monthlyTxs
        .filter((tx) => tx.type === 'income')
        .reduce((s, tx) => s + tx.amount, 0)
    const totalExpenses = monthlyTxs
        .filter((tx) => tx.type === 'expense')
        .reduce((s, tx) => s + tx.amount, 0)
    const totalBalance = totalIncome - totalExpenses

    // Per-member stats (own transactions only, not shared)
    const memberStats = members.map((m) => {
        const mTxs = monthlyTxs.filter((tx) => tx.memberId === m.id)
        const mExp = mTxs
            .filter((tx) => tx.type === 'expense')
            .reduce((s, tx) => s + tx.amount, 0)
        const mInc = mTxs
            .filter((tx) => tx.type === 'income')
            .reduce((s, tx) => s + tx.amount, 0)
        return { member: m, expenses: mExp, income: mInc, balance: mInc - mExp }
    })

    const pickMonth = (mIdx: number) => {
        const newMonth = `${navYear}-${String(mIdx + 1).padStart(2, '0')}`
        onMonthChange(newMonth)
        setOpen(false)
    }

    const handleTriggerClick = (e: { stopPropagation(): void }) => {
        e.stopPropagation()
        if (!open) setNavYear(year)
        setOpen((v) => !v)
    }

    return (
        <div className="hero">
            <div className="hero-bg" />

            <div className="htop">
                <div>
                    <div className="htitle">{t.appName}</div>
                    <div className="hsub">{t.appSubtitle}</div>
                </div>

                {/* Month picker */}
                <div className="mpw">
                    <button className="mp-trig" onClick={handleTriggerClick}>
                        📅 {t.monthNamesShort[monthIdx0]} {year} {open ? '▲' : '▼'}
                    </button>

                    {open && (
                        <div className="mp-pop" onClick={(e) => e.stopPropagation()}>
                            <div className="mp-year-row">
                                <button
                                    className="mp-ybtn"
                                    onClick={(e) => { e.stopPropagation(); setNavYear((y) => y - 1) }}
                                >
                                    ‹
                                </button>
                                <span className="mp-ylbl">{navYear}</span>
                                <button
                                    className="mp-ybtn"
                                    onClick={(e) => { e.stopPropagation(); setNavYear((y) => y + 1) }}
                                >
                                    ›
                                </button>
                            </div>
                            <div className="mp-grid">
                                {t.monthNamesShort.map((name, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`mp-m${navYear === year && i === monthIdx0 ? ' cur' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); pickMonth(i) }}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="hbal-lbl">{t.monthlyBalance}</div>
            <div className="hbal">{fmt(totalBalance)}</div>

            {memberStats.length > 0 && (
                <div className="hboxes">
                    {memberStats.map(({ member, expenses, income, balance }) => (
                        <div key={member.id} className="hbox">
                            <div className="hbox-name">{getMemberName(member)}</div>
                            <div className="hbox-exp">{t.shortExp} {fmt(expenses)}</div>
                            <div className="hbox-inc">{t.shortInc} {fmt(income)}</div>
                            <div
                                className="hbox-bal"
                                style={{ color: balance >= 0 ? '#86efac' : '#fca5a5' }}
                            >
                                {fmt(balance)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
