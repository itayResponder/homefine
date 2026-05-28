// src/components/app/SettingsView.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { CATEGORY_ICONS } from '../../constants/categories'
import type { LogEntry, Member, RecurringCharge, Transaction, TransactionCategory } from '../../types'

interface Props {
    transactions: Transaction[]
    recurringCharges: RecurringCharge[]
    members: Member[]
    logs: LogEntry[]
    onAddMember: (name: string, nameEn?: string) => void
    onRemoveMember: (id: string) => void
}

export function SettingsView({ transactions, recurringCharges, members, logs, onAddMember, onRemoveMember }: Props) {
    const { t } = useI18n()
    const [newName, setNewName] = useState('')
    const [newNameEn, setNewNameEn] = useState('')
    const categories = Object.entries(t.categoryOptions) as [TransactionCategory, string][]

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault()
        const name = newName.trim()
        if (!name) return
        onAddMember(name, newNameEn.trim() || undefined)
        setNewName('')
        setNewNameEn('')
    }

    const handleExport = () => {
        const data = { transactions, recurringCharges, members, logs }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'homefine-export.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            {/* Member management */}
            <div className="fcard">
                <div className="fttl">👥 {t.membersLabel}</div>
                {members.length > 0 && (
                    <div className="catchips" style={{ marginBottom: 12 }}>
                        {members.map((m) => (
                            <div key={m.id} className="catchip" style={{ border: `1.5px solid ${m.color}40`, color: m.color, background: m.color + '15' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block', flexShrink: 0 }} />
                                {m.name}
                                <button onClick={() => onRemoveMember(m.id)} title="מחק חבר">×</button>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleAddMember}>
                    <div className="fg fg2" style={{ marginBottom: 8 }}>
                        <div className="fl">
                            <label>{t.memberNameLabel}</label>
                            <input
                                className="inp"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t.memberNamePlaceholder}
                                required
                            />
                        </div>
                        <div className="fl">
                            <label>{t.memberNameEnLabel}</label>
                            <input
                                className="inp"
                                value={newNameEn}
                                onChange={(e) => setNewNameEn(e.target.value)}
                                placeholder={t.memberNameEnPlaceholder}
                            />
                        </div>
                    </div>
                    <button type="submit" className="sbtn">{t.add}</button>
                </form>
            </div>

            {/* Categories */}
            <div className="fcard">
                <div className="fttl">{t.categoriesLabel}</div>
                <div className="catchips">
                    {categories.map(([k]) => (
                        <div key={k} className="catchip">
                            <span>{CATEGORY_ICONS[k as TransactionCategory]}</span>
                            {t.categoryNames[k as TransactionCategory]}
                        </div>
                    ))}
                </div>
            </div>

            {/* Export */}
            <div className="fcard">
                <div className="fttl">{t.exportTitle}</div>
                <button
                    onClick={handleExport}
                    style={{
                        padding: '9px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: 'var(--rs)',
                        border: '1.5px solid var(--ib)',
                        background: 'var(--ibg)',
                        color: 'var(--ac)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    {t.exportJsonBtn}
                </button>
            </div>
        </div>
    )
}
