// src/components/app/AddMemberModal.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import type { Member } from '../../types'

interface Props {
    onAdd: (name: string, nameEn?: string) => void
    onClose: () => void
    members: Member[]
}

const HEBREW_RE = /^[א-ת\s'-]+$/
const LATIN_RE = /^[a-zA-Z\s'-]+$/

export function AddMemberModal({ onAdd, onClose, members }: Props) {
    const { t } = useI18n()
    const [name, setName] = useState('')
    const [nameEn, setNameEn] = useState('')
    const [errors, setErrors] = useState<{ name?: string; nameEn?: string }>({})

    const validateName = (val: string): string | undefined => {
        if (!val.trim()) return t.memberNameRequired
        if (!HEBREW_RE.test(val.trim())) return t.memberNameInvalidFormat
        return undefined
    }

    const validateNameEn = (val: string): string | undefined => {
        if (!val.trim()) return t.memberNameEnRequired
        if (!LATIN_RE.test(val.trim())) return t.memberNameEnInvalidFormat
        return undefined
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setName(val)
        setErrors(prev => ({ ...prev, name: validateName(val) }))
    }

    const handleNameEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setNameEn(val)
        setErrors(prev => ({ ...prev, nameEn: validateNameEn(val) }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const nameErr = validateName(name)
        const nameEnErr = validateNameEn(nameEn)
        if (nameErr || nameEnErr) {
            setErrors({ name: nameErr, nameEn: nameEnErr })
            return
        }
        const trimmedName = name.trim()
        const trimmedNameEn = nameEn.trim()
        const dupName = members.some(m => m.name.trim() === trimmedName)
        const dupNameEn = members.some(m => m.nameEn?.trim().toLowerCase() === trimmedNameEn.toLowerCase())
        if (dupName || dupNameEn) {
            setErrors({
                name: dupName ? t.memberNameDuplicate : undefined,
                nameEn: dupNameEn ? t.memberNameEnDuplicate : undefined,
            })
            return
        }
        onAdd(trimmedName, trimmedNameEn)
        onClose()
    }

    return (
        <div className="ap-modal-overlay" onClick={onClose}>
            <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-header">
                    <span className="ap-modal-title">👥 {t.membersLabel}</span>
                    <button className="ap-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="ap-modal-body">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="fg fg2 ap-member-fields">
                            <div className="fl">
                                <label>{t.memberNameLabel}</label>
                                <input
                                    className={`inp${errors.name ? ' inp--error' : ''}`}
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder={t.memberNamePlaceholder}
                                    autoFocus
                                />
                                {errors.name && <span className="field-error">{errors.name}</span>}
                            </div>
                            <div className="fl">
                                <label>{t.memberNameEnLabel}</label>
                                <input
                                    className={`inp${errors.nameEn ? ' inp--error' : ''}`}
                                    value={nameEn}
                                    onChange={handleNameEnChange}
                                    placeholder={t.memberNameEnPlaceholder}
                                />
                                {errors.nameEn && <span className="field-error">{errors.nameEn}</span>}
                            </div>
                        </div>
                        <button type="submit" className="sbtn">{t.add}</button>
                    </form>
                </div>
            </div>
        </div>
    )
}
