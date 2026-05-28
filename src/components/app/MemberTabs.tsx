// src/components/app/MemberTabs.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import type { Member } from '../../types'
import './MemberTabs.css'

interface Props {
    members: Member[]
    tab: string
    onTabChange: (id: string) => void
    onAddMember: (name: string) => void
}

export function MemberTabs({ members, tab, onTabChange, onAddMember }: Props) {
    const { t } = useI18n()
    const [showInput, setShowInput] = useState(false)
    const [name, setName] = useState('')

    const handleAdd = () => {
        const trimmed = name.trim()
        if (!trimmed) return
        onAddMember(trimmed)
        setName('')
        setShowInput(false)
    }

    return (
        <div className="ap-tabs">
            <button
                className={`ap-tab${tab === 'shared' ? ' ap-tab--active' : ''}`}
                onClick={() => onTabChange('shared')}
            >
                {t.shared}
            </button>

            {members.map((m) => (
                <button
                    key={m.id}
                    className={`ap-tab${tab === m.id ? ' ap-tab--active' : ''}`}
                    style={
                        tab === m.id
                            ? { borderColor: m.color, color: m.color, background: `${m.color}18` }
                            : {}
                    }
                    onClick={() => onTabChange(m.id)}
                >
                    {m.name}
                </button>
            ))}

            {showInput ? (
                <div className="ap-add-member-row">
                    <input
                        autoFocus
                        className="ap-add-member-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd()
                            if (e.key === 'Escape') setShowInput(false)
                        }}
                        placeholder={t.memberPlaceholder}
                    />
                    <button onClick={handleAdd} className="ap-add-member-confirm">
                        {t.add}
                    </button>
                    <button onClick={() => setShowInput(false)} className="ap-add-member-cancel">
                        ✕
                    </button>
                </div>
            ) : (
                <button className="ap-tab ap-tab--ghost" onClick={() => setShowInput(true)}>
                    {t.addMember}
                </button>
            )}
        </div>
    )
}
