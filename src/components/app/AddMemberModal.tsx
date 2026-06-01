// src/components/app/AddMemberModal.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'

interface Props {
    onAdd: (name: string, nameEn?: string) => void
    onClose: () => void
}

export function AddMemberModal({ onAdd, onClose }: Props) {
    const { t } = useI18n()
    const [name, setName] = useState('')
    const [nameEn, setNameEn] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const n = name.trim()
        if (!n) return
        onAdd(n, nameEn.trim() || undefined)
        onClose()
    }

    return (
        <div className="ap-modal-overlay" onClick={onClose}>
            <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <span className="ap-modal-title">👥 {t.membersLabel}</span>
                    <button className="ap-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="fg fg2" style={{ marginBottom: 8 }}>
                        <div className="fl">
                            <label>{t.memberNameLabel}</label>
                            <input
                                className="inp"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.memberNamePlaceholder}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="fl">
                            <label>{t.memberNameEnLabel}</label>
                            <input
                                className="inp"
                                value={nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
                                placeholder={t.memberNameEnPlaceholder}
                            />
                        </div>
                    </div>
                    <button type="submit" className="sbtn">{t.add}</button>
                </form>
            </div>
        </div>
    )
}
