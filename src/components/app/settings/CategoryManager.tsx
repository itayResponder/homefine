// src/components/app/settings/CategoryManager.tsx
import { useRef, useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { EmojiPicker } from '../../ui/EmojiPicker'
import type { Category } from '../../../types'
import './CategoryManager.css'

interface Props {
    categories: Category[]
    onAdd: (cat: Omit<Category, 'id'>) => Promise<string>
    onUpdate: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

interface FormState {
    name: string
    nameEn: string
    icon: string
}

const emptyForm = (): FormState => ({ name: '', nameEn: '', icon: '💰' })

type EditingState =
    | { mode: 'add' }
    | { mode: 'edit'; id: string }
    | null

export function CategoryManager({ categories, onAdd, onUpdate, onDelete }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'

    const triggerRef = useRef<HTMLButtonElement>(null)
    const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null)

    const [editing, setEditing] = useState<EditingState>(null)
    const [form, setForm] = useState<FormState>(emptyForm())
    const [errors, setErrors] = useState<{ name?: string; nameEn?: string }>({})
    const [showPicker, setShowPicker] = useState(false)
    const [saving, setSaving] = useState(false)

    const openAdd = () => {
        setForm(emptyForm())
        setErrors({})
        setEditing({ mode: 'add' })
    }

    const openEdit = (cat: Category) => {
        setForm({ name: cat.name, nameEn: cat.nameEn, icon: cat.icon })
        setErrors({})
        setEditing({ mode: 'edit', id: cat.id })
    }

    const cancel = () => {
        setEditing(null)
        setErrors({})
        setShowPicker(false)
        setPickerAnchor(null)
    }

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(f => ({ ...f, [key]: value }))
        setErrors(e => ({ ...e, [key]: undefined }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: typeof errors = {}
        if (!form.name.trim()) newErrors.name = t.categoryNameRequired
        if (!form.nameEn.trim()) newErrors.nameEn = t.categoryNameEnRequired
        if (Object.keys(newErrors).length) { setErrors(newErrors); return }

        setSaving(true)
        const order = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0
        if (editing?.mode === 'add') {
            await onAdd({ name: form.name.trim(), nameEn: form.nameEn.trim(), icon: form.icon, order })
        } else if (editing?.mode === 'edit') {
            await onUpdate(editing.id, { name: form.name.trim(), nameEn: form.nameEn.trim(), icon: form.icon })
        }
        setSaving(false)
        cancel()
    }

    const handleDelete = async (id: string) => {
        await onDelete(id)
    }

    return (
        <div className="cm-root">
            {/* Category list */}
            <div className="cm-list">
                {categories.map(cat => (
                    <div key={cat.id} className="cm-chip">
                        <span className="cm-chip-icon">{cat.icon}</span>
                        <span className="cm-chip-name">{isRtl ? cat.name : (cat.nameEn || cat.name)}</span>
                        <button
                            type="button"
                            className="cm-chip-btn cm-chip-edit"
                            onClick={() => openEdit(cat)}
                            title={t.categoryEditBtn}
                        >✏️</button>
                        <button
                            type="button"
                            className="cm-chip-btn cm-chip-delete"
                            onClick={() => handleDelete(cat.id)}
                            title={t.categoryDeleteBtn}
                        >×</button>
                    </div>
                ))}
            </div>

            {/* Add button */}
            {!editing && (
                <button type="button" className="cm-add-btn" onClick={openAdd}>
                    {t.categoryAddBtn}
                </button>
            )}

            {/* Add / Edit form */}
            {editing && (
                <form className="cm-form" onSubmit={handleSubmit} noValidate>
                    <div className="cm-form-title">
                        {editing.mode === 'add' ? t.categoryNewTitle : t.categoryEditTitle}
                    </div>

                    {/* Icon picker trigger */}
                    <div className="cm-field">
                        <label>{t.categoryIconLabel}</label>
                        <button
                            ref={triggerRef}
                            type="button"
                            className="cm-icon-trigger"
                            onClick={() => {
                                if (showPicker) {
                                    setShowPicker(false)
                                    setPickerAnchor(null)
                                } else {
                                    setPickerAnchor(triggerRef.current?.getBoundingClientRect() ?? null)
                                    setShowPicker(true)
                                }
                            }}
                        >
                            <span className="cm-icon-preview">{form.icon}</span>
                            <span className="cm-icon-caret">▾</span>
                        </button>
                        {showPicker && (
                            <EmojiPicker
                                value={form.icon}
                                anchorRect={pickerAnchor}
                                onChange={emoji => { setField('icon', emoji); setShowPicker(false); setPickerAnchor(null) }}
                                onClose={() => { setShowPicker(false); setPickerAnchor(null) }}
                            />
                        )}
                    </div>

                    {/* Hebrew name */}
                    <div className="cm-field">
                        <label>{t.categoryNameLabel}</label>
                        <input
                            className={`cm-input${errors.name ? ' cm-input--error' : ''}`}
                            value={form.name}
                            onChange={e => setField('name', e.target.value)}
                            placeholder={t.categoryNamePlaceholder}
                            dir="rtl"
                        />
                        {errors.name && <span className="cm-field-error">{errors.name}</span>}
                    </div>

                    {/* English name */}
                    <div className="cm-field">
                        <label>{t.categoryNameEnLabel}</label>
                        <input
                            className={`cm-input${errors.nameEn ? ' cm-input--error' : ''}`}
                            value={form.nameEn}
                            onChange={e => setField('nameEn', e.target.value)}
                            placeholder={t.categoryNameEnPlaceholder}
                            dir="ltr"
                        />
                        {errors.nameEn && <span className="cm-field-error">{errors.nameEn}</span>}
                    </div>

                    <div className="cm-form-actions">
                        <button
                            type="button"
                            className="cm-cancel-btn"
                            onClick={cancel}
                        >
                            {t.categoryCancelBtn}
                        </button>
                        <button
                            type="submit"
                            className="cm-save-btn"
                            disabled={saving}
                        >
                            {saving ? '...' : t.categorySaveBtn}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
