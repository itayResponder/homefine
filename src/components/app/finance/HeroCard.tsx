// src/components/app/finance/HeroCard.tsx
import { useState, useEffect } from 'react'
import { useI18n } from '../../../i18n/context'
import { useMemberName } from '../../../hooks/useMemberName'
import { Money } from '../../ui/Money'
import { AmountInput } from '../../ui/AmountInput'
import { subscribeHouseholdBalance, setHouseholdBalance } from '../../../firebase/households'
import type { Member, Transaction } from '../../../types'

interface Props {
    members: Member[]
    transactions: Transaction[]
    month: string   // YYYY-MM
    onMonthChange: (month: string) => void
    householdName?: string
    currentUserId?: string
    householdId: string
}

export function HeroCard({ members, transactions, month, onMonthChange, householdName, currentUserId, householdId }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()

    const [year, monthIndex] = month.split('-').map((n, i) => i === 1 ? Number(n) - 1 : Number(n))
    const [open, setOpen] = useState(false)
    const [navYear, setNavYear] = useState(year)

    const [checkingBalance, setCheckingBalance] = useState<number | null>(null)
    const [editing, setEditing] = useState(false)
    const [inputVal, setInputVal] = useState('')

    useEffect(() => {
        if (!currentUserId) return
        return subscribeHouseholdBalance(currentUserId, householdId, setCheckingBalance)
    }, [currentUserId, householdId])

    const startEdit = () => {
        setInputVal(checkingBalance !== null ? String(checkingBalance) : '')
        setEditing(true)
    }

    const toggleSign = () => {
        setInputVal(v => v.startsWith('-') ? v.slice(1) : `-${v}`)
    }

    const saveEdit = async () => {
        if (!currentUserId) return
        const parsed = parseFloat(inputVal)
        if (!isNaN(parsed)) {
            await setHouseholdBalance(currentUserId, householdId, parsed)
        }
        setEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit()
        if (e.key === 'Escape') setEditing(false)
    }

    const isVisible = (tx: Transaction) => {
        if (tx.type !== 'income') return true
        const member = members.find(m => m.id === tx.memberId)
        if (!member?.privateIncome) return true
        return member.userId === currentUserId
    }

    const monthlyTxs = transactions.filter((tx) => tx.date.startsWith(month) && isVisible(tx))

    const totalIncome = monthlyTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const totalExpenses = monthlyTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const totalBalance = totalIncome - totalExpenses

    // Personal balance — only the current user's member(s)
    const myMemberIds = members.filter(m => m.userId === currentUserId).map(m => m.id)
    const myTxs = monthlyTxs.filter(tx => myMemberIds.includes(tx.memberId))
    const myIncome = myTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const myExpenses = myTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const myBalance = myIncome - myExpenses
    const futureBalance = checkingBalance !== null ? checkingBalance + myBalance : null

    // Per-member stats (own transactions only, not shared)
    const memberStats = members.map((m) => {
        const mTxs = monthlyTxs.filter((tx) => tx.memberId === m.id)
        const mExp = mTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
        const mInc = mTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
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

    const balanceColor = (n: number) => n >= 0 ? '#86efac' : '#fca5a5'

    return (
        <div className="hero">
            <div className="hero-bg" />

            <div className="htop">
                <div>
                    <div className="htitle">{householdName ?? t.appName}</div>
                    <div className="hsub">{t.appSubtitle}</div>
                </div>

                {/* Month picker */}
                <div className="mpw">
                    <button className="mp-trig" onClick={handleTriggerClick}>
                        📅 {t.monthNamesShort[monthIndex]} {year} {open ? '▲' : '▼'}
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
                                        className={`mp-m${navYear === year && i === monthIndex ? ' cur' : ''}`}
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

            <div className="hbal-rows">
                {/* Row 1 — monthly balance */}
                <div className="hbal-row">
                    <span className="hbal-row-lbl">{t.monthlyBalance}</span>
                    <span className="hbal-row-val" style={{ color: balanceColor(totalBalance) }}>
                        <Money amount={Math.abs(totalBalance)} sign={totalBalance < 0 ? '−' : ''} />
                    </span>
                </div>

                {/* Row 2 — checking account (editable) */}
                <div className="hbal-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="hbal-row-lbl">{t.checkingAccount}</span>
                        {!editing && (
                            <button className="editbtn" onClick={startEdit} title={t.editBtn}>✎</button>
                        )}
                    </div>
                    {editing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button className="hbal-cancel-btn" onClick={() => setEditing(false)}>{t.cancel}</button>
                            <button className="hbal-sign-btn" onClick={toggleSign}>
                                {inputVal.startsWith('-') ? '+' : '−'}
                            </button>
                            <AmountInput
                                value={inputVal.startsWith('-') ? inputVal.slice(1) : inputVal}
                                onChange={(v) => setInputVal(inputVal.startsWith('-') ? `-${v}` : v)}
                                placeholder="0"
                                className="inp hbal-inp-hero"
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button className="hbal-save-btn" onClick={saveEdit}>{t.saveChanges}</button>
                        </div>
                    ) : (
                        <span
                            className="hbal-row-val"
                            style={{ color: checkingBalance !== null ? balanceColor(checkingBalance) : 'rgba(255,255,255,0.4)' }}
                        >
                            {checkingBalance !== null
                                ? <Money amount={Math.abs(checkingBalance)} sign={checkingBalance < 0 ? '−' : ''} />
                                : '—'
                            }
                        </span>
                    )}
                </div>

                {/* Row 3 — projected balance (only if checking balance is set) */}
                {futureBalance !== null && (
                    <div className="hbal-row">
                        <span className="hbal-row-lbl">{t.futureBalance}</span>
                        <span className="hbal-row-val" style={{ color: balanceColor(futureBalance) }}>
                            <Money amount={Math.abs(futureBalance)} sign={futureBalance < 0 ? '−' : ''} />
                        </span>
                    </div>
                )}
            </div>

            {memberStats.length > 0 && (
                <div className="hboxes">
                    {memberStats.map(({ member, expenses, income, balance: mBal }) => (
                        <div key={member.id} className="hbox">
                            <div className="hbox-name">{getMemberName(member)}</div>
                            <div className="hbox-exp" style={{ color: '#fca5a5' }}>
                                {t.shortExp} <Money amount={expenses} sign="−" />
                            </div>
                            <div className="hbox-inc" style={{ color: '#86efac' }}>
                                {t.shortInc} <Money amount={income} />
                            </div>
                            <div
                                className="hbox-bal"
                                style={{ color: mBal >= 0 ? '#86efac' : '#fca5a5' }}
                            >
                                <Money amount={Math.abs(mBal)} sign={mBal < 0 ? '−' : ''} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
