// src/components/app/AppNav.tsx
import type { Member } from '../../types'
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'

export type AppView = string

interface Props {
    view: AppView
    members: Member[]
    onChange: (v: AppView) => void
    onRemoveMember: (id: string) => void
}

export function AppNav({ view, members, onChange, onRemoveMember }: Props) {
    const { t } = useI18n()
    const memberName = useMemberName()

    const fixed = [
        { value: 'summary',   label: t.tabSummary },
        { value: 'expenses',  label: t.tabExpenses },
        { value: 'income',    label: t.tabIncome },
    ]

    const tail = [
        { value: 'recurring', label: t.navRecurring },
    ]

    return (
        <div className="pills">
            {fixed.map((p) => (
                <button
                    key={p.value}
                    className={`pill${view === p.value ? ' active' : ''}`}
                    onClick={() => onChange(p.value)}
                >
                    {p.label}
                </button>
            ))}

            {members.map((m) => {
                const val = `member:${m.id}`
                const isActive = view === val
                return (
                    <button
                        key={val}
                        className={`pill pill--member${isActive ? ' active' : ''}`}
                        onClick={() => onChange(val)}
                    >
                        {memberName(m)}
                        <span
                            className="pill-remove"
                            onClick={(e) => { e.stopPropagation(); onRemoveMember(m.id) }}
                            aria-label={`Remove ${memberName(m)}`}
                        >
                            ×
                        </span>
                    </button>
                )
            })}

            {tail.map((p) => (
                <button
                    key={p.value}
                    className={`pill${view === p.value ? ' active' : ''}`}
                    onClick={() => onChange(p.value)}
                >
                    {p.label}
                </button>
            ))}
        </div>
    )
}
