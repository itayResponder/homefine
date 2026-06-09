// src/components/app/settings/EditMemberModal.tsx
import { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import type { Member } from '../../../types'

interface Props {
    member: Member
    onSave: (name: string, nameEn?: string) => void
    onClose: () => void
}

export function EditMemberModal({ member, onSave, onClose }: Props) {
    const { t } = useI18n()
    const [name, setName] = useState(member.name)
    const [nameEn, setNameEn] = useState(member.nameEn ?? '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const n = name.trim()
        if (!n) return
        onSave(n, nameEn.trim() || undefined)
        onClose()
    }

    return (
        <div className="ap-modal-overlay" onClick={onClose}>
            <div className="ap-modal ap-modal--member-edit" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <span className="ap-modal-title">✏️ {t.settings.editNameTitle}</span>
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
                    <button type="submit" className="sbtn">{t.saveChanges}</button>
                </form>
            </div>
        </div>
    )
}
