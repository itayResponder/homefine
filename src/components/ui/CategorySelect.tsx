// src/components/ui/CategorySelect.tsx
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EmojiPicker } from './EmojiPicker'
import { useI18n } from '../../i18n/context'
import type { Category } from '../../types'
import './CategorySelect.css'

interface Props {
    categories: Category[]
    value: string
    onChange: (categoryId: string) => void
    onAddCategory: (cat: Omit<Category, 'id'>) => Promise<string>
    placeholder?: string
    error?: boolean
}

interface AddForm {
    icon: string
    name: string
    nameEn: string
}

const emptyAdd = (): AddForm => ({ icon: '💰', name: '', nameEn: '' })

export function CategorySelect({ categories, value, onChange, onAddCategory, placeholder, error }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [mode, setMode] = useState<'list' | 'add'>('list')
    const [addForm, setAddForm] = useState<AddForm>(emptyAdd())
    const [addErrors, setAddErrors] = useState<{ name?: string; nameEn?: string }>({})
    const [saving, setSaving] = useState(false)
    const [showPicker, setShowPicker] = useState(false)
    const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null)
    const iconBtnRef = useRef<HTMLButtonElement>(null)

    const selected = categories.find(c => c.id === value)

    const q = search.trim().toLowerCase()
    const filtered = q
        ? categories.filter(c =>
            c.name.includes(q) || c.nameEn.toLowerCase().includes(q)
          )
        : categories

    const catName = (cat: Category) => isRtl ? cat.name : (cat.nameEn || cat.name)

    const openModal = () => {
        setSearch('')
        setMode('list')
        setAddForm(emptyAdd())
        setAddErrors({})
        setOpen(true)
    }

    const closeModal = () => {
        setOpen(false)
        setShowPicker(false)
        setPickerAnchor(null)
    }

    const selectCat = (id: string) => {
        onChange(id)
        closeModal()
    }

    const setAddField = <K extends keyof AddForm>(key: K, val: AddForm[K]) => {
        setAddForm(f => ({ ...f, [key]: val }))
        setAddErrors(e => ({ ...e, [key]: undefined }))
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        const errs: typeof addErrors = {}
        if (!addForm.name.trim()) errs.name = t.categoryNameRequired
        if (!addForm.nameEn.trim()) errs.nameEn = t.categoryNameEnRequired
        if (Object.keys(errs).length) { setAddErrors(errs); return }

        setSaving(true)
        const order = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0
        const newId = await onAddCategory({
            name: addForm.name.trim(),
            nameEn: addForm.nameEn.trim(),
            icon: addForm.icon,
            order,
        })
        setSaving(false)
        onChange(newId)
        closeModal()
    }

    return (
        <>
            <button
                type="button"
                className={`csel-trigger${error ? ' csel-trigger--error' : ''}`}
                onClick={openModal}
            >
                {selected ? (
                    <>
                        <span className="csel-trigger-icon">{selected.icon}</span>
                        <span className="csel-trigger-name">{catName(selected)}</span>
                    </>
                ) : (
                    <span className="csel-trigger-placeholder">
                        {placeholder ?? t.categoryLabel}
                    </span>
                )}
                <span className="csel-trigger-arr">▼</span>
            </button>

            {open && createPortal(
                <>
                    <div className="csel-backdrop" onClick={closeModal} />
                    <div className="csel-panel" onClick={e => e.stopPropagation()}>

                        {/* Search header — only in list mode */}
                        {mode === 'list' && (
                            <div className="csel-header">
                                <input
                                    className="csel-search"
                                    placeholder={t.categorySearchPlaceholder}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        {mode === 'list' ? (
                            <>
                                <div className="csel-grid">
                                    {filtered.length > 0 ? filtered.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`csel-item${cat.id === value ? ' csel-item--active' : ''}`}
                                            onClick={() => selectCat(cat.id)}
                                        >
                                            <span className="csel-item-icon">{cat.icon}</span>
                                            <span className="csel-item-name">{catName(cat)}</span>
                                        </button>
                                    )) : (
                                        <div className="csel-empty">{isRtl ? 'לא נמצאו תוצאות' : 'No results'}</div>
                                    )}
                                </div>
                                <div className="csel-footer">
                                    <button
                                        type="button"
                                        className="csel-add-btn"
                                        onClick={() => { setMode('add'); setSearch('') }}
                                    >
                                        {t.categoryAddBtn}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form className="csel-add-form" onSubmit={handleAdd} noValidate>
                                <div className="csel-add-title">{t.categoryNewTitle}</div>

                                {/* Icon picker */}
                                <div className="csel-add-field">
                                    <label>{t.categoryIconLabel}</label>
                                    <button
                                        ref={iconBtnRef}
                                        type="button"
                                        className="csel-icon-trigger"
                                        onClick={() => {
                                            if (showPicker) {
                                                setShowPicker(false)
                                                setPickerAnchor(null)
                                            } else {
                                                setPickerAnchor(iconBtnRef.current?.getBoundingClientRect() ?? null)
                                                setShowPicker(true)
                                            }
                                        }}
                                    >
                                        <span>{addForm.icon}</span>
                                        <span className="csel-icon-caret">▾</span>
                                    </button>
                                    {showPicker && (
                                        <EmojiPicker
                                            value={addForm.icon}
                                            anchorRect={pickerAnchor}
                                            onChange={emoji => {
                                                setAddField('icon', emoji)
                                                setShowPicker(false)
                                                setPickerAnchor(null)
                                            }}
                                            onClose={() => {
                                                setShowPicker(false)
                                                setPickerAnchor(null)
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Hebrew name */}
                                <div className="csel-add-field">
                                    <label>{t.categoryNameLabel}</label>
                                    <input
                                        className={`csel-input${addErrors.name ? ' csel-input--error' : ''}`}
                                        value={addForm.name}
                                        onChange={e => setAddField('name', e.target.value)}
                                        placeholder={t.categoryNamePlaceholder}
                                        dir="rtl"
                                    />
                                    {addErrors.name && (
                                        <span className="csel-field-error">{addErrors.name}</span>
                                    )}
                                </div>

                                {/* English name */}
                                <div className="csel-add-field">
                                    <label>{t.categoryNameEnLabel}</label>
                                    <input
                                        className={`csel-input${addErrors.nameEn ? ' csel-input--error' : ''}`}
                                        value={addForm.nameEn}
                                        onChange={e => setAddField('nameEn', e.target.value)}
                                        placeholder={t.categoryNameEnPlaceholder}
                                        dir="ltr"
                                    />
                                    {addErrors.nameEn && (
                                        <span className="csel-field-error">{addErrors.nameEn}</span>
                                    )}
                                </div>

                                <div className="csel-add-actions">
                                    <button
                                        type="button"
                                        className="csel-cancel-btn"
                                        onClick={() => setMode('list')}
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="csel-save-btn"
                                        disabled={saving}
                                    >
                                        {saving ? '...' : t.categorySaveBtn}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    )
}
