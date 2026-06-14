// src/components/ui/CategorySelect.tsx
import { useState } from 'react'
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
    onUpdateCategory?: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDeleteCategory?: (id: string) => Promise<void>
    placeholder?: string
    error?: boolean
    // Management mode — used by CategoryManager
    defaultOpen?: boolean
    defaultMode?: 'list' | 'add' | 'edit'
    defaultEditId?: string
    onClose?: () => void
}

interface AddForm {
    icon: string
    name: string
    nameEn: string
}

const emptyAdd = (): AddForm => ({ icon: '💰', name: '', nameEn: '' })

function initAddForm(props: Props): AddForm {
    if (props.defaultOpen && props.defaultMode === 'edit' && props.defaultEditId) {
        const cat = props.categories.find(c => c.id === props.defaultEditId)
        if (cat) return { icon: cat.icon, name: cat.name, nameEn: cat.nameEn }
    }
    return emptyAdd()
}

export function CategorySelect(props: Props) {
    const { categories, value, onChange, onAddCategory, onUpdateCategory, onDeleteCategory,
            placeholder, error, defaultOpen, defaultMode, defaultEditId, onClose } = props

    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'

    const [open, setOpen] = useState(defaultOpen ?? false)
    const [search, setSearch] = useState('')
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>(() => {
        if (defaultOpen && defaultMode) return defaultMode
        return 'list'
    })
    const [editingId, setEditingId] = useState<string | null>(() => {
        if (defaultOpen && defaultMode === 'edit' && defaultEditId) return defaultEditId
        return null
    })
    const [addForm, setAddForm] = useState<AddForm>(() => initAddForm(props))
    const [addErrors, setAddErrors] = useState<{ name?: string; nameEn?: string }>({})
    const [saving, setSaving] = useState(false)
    // wizard step — 'icon' shows inline EmojiPicker, 'details' shows name fields
    const [step, setStep] = useState<'icon' | 'details'>(() => {
        if (defaultOpen && defaultMode === 'edit') return 'details'
        return 'icon'
    })

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
        setEditingId(null)
        setAddForm(emptyAdd())
        setAddErrors({})
        setStep('icon')
        setOpen(true)
    }

    const closeModal = () => {
        setOpen(false)
        onClose?.()
    }

    const selectCat = (id: string) => {
        onChange(id)
        closeModal()
    }

    const setAddField = <K extends keyof AddForm>(key: K, val: AddForm[K]) => {
        setAddForm(f => ({ ...f, [key]: val }))
        setAddErrors(e => ({ ...e, [key]: undefined }))
    }

    const openEdit = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingId(cat.id)
        setAddForm({ icon: cat.icon, name: cat.name, nameEn: cat.nameEn })
        setAddErrors({})
        setStep('details')
        setMode('edit')
    }

    const backToList = () => {
        setMode('list')
        setEditingId(null)
        setAddForm(emptyAdd())
        setAddErrors({})
        setStep('icon')
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
        if (!defaultOpen) {
            onChange(newId)
            closeModal()
        } else {
            backToList()
            closeModal()
        }
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingId) return
        const errs: typeof addErrors = {}
        if (!addForm.name.trim()) errs.name = t.categoryNameRequired
        if (!addForm.nameEn.trim()) errs.nameEn = t.categoryNameEnRequired
        if (Object.keys(errs).length) { setAddErrors(errs); return }

        setSaving(true)
        await onUpdateCategory?.(editingId, {
            name: addForm.name.trim(),
            nameEn: addForm.nameEn.trim(),
            icon: addForm.icon,
        })
        setSaving(false)
        if (defaultOpen) {
            closeModal()
        } else {
            backToList()
        }
    }

    const handleDelete = async () => {
        if (!editingId) return
        setSaving(true)
        await onDeleteCategory?.(editingId)
        setSaving(false)
        if (value === editingId) onChange('')
        if (defaultOpen) {
            closeModal()
        } else {
            backToList()
        }
    }

    const canEdit = !!(onUpdateCategory || onDeleteCategory)

    return (
        <>
            {!defaultOpen && (
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
            )}

            {open && createPortal(
                <>
                    <div className="csel-backdrop" onClick={closeModal} />
                    <div className="csel-panel" onClick={e => e.stopPropagation()}>

                        <button
                            type="button"
                            className="csel-close-btn"
                            onClick={closeModal}
                            aria-label="Close"
                        >✕</button>

                        {/* Search header — only in list mode */}
                        {mode === 'list' && (
                            <div className="csel-header">
                                <input
                                    className="csel-search"
                                    placeholder={t.categorySearchPlaceholder}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus={!window.matchMedia('(max-width: 600px)').matches}
                                />
                            </div>
                        )}

                        {mode === 'list' ? (
                            <>
                                <div className="csel-grid">
                                    {filtered.length > 0 ? filtered.map(cat => (
                                        <div key={cat.id} className="csel-item-wrap">
                                            <button
                                                type="button"
                                                className={`csel-item${cat.id === value ? ' csel-item--active' : ''}`}
                                                onClick={() => selectCat(cat.id)}
                                            >
                                                <span className="csel-item-icon">{cat.icon}</span>
                                                <span className="csel-item-name">{catName(cat)}</span>
                                            </button>
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    className="csel-item-edit-btn"
                                                    onClick={e => openEdit(cat, e)}
                                                    aria-label="Edit category"
                                                >✏️</button>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="csel-empty">{isRtl ? 'לא נמצאו תוצאות' : 'No results'}</div>
                                    )}
                                </div>
                                <div className="csel-footer">
                                    <button
                                        type="button"
                                        className="csel-add-btn"
                                        onClick={() => { setMode('add'); setStep('icon'); setSearch('') }}
                                    >
                                        {t.categoryAddBtn}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* ── Wizard form (add / edit) ── */
                            <form
                                className="csel-add-form"
                                onSubmit={mode === 'edit' ? handleEdit : handleAdd}
                                noValidate
                            >
                                <div className="csel-add-title">
                                    {mode === 'edit' ? t.categoryEditTitle : t.categoryNewTitle}
                                </div>

                                {/* Step 1 — icon picker */}
                                {step === 'icon' ? (
                                    <>
                                        <EmojiPicker
                                            value={addForm.icon}
                                            onChange={emoji => setAddField('icon', emoji)}
                                            onClose={() => {}}
                                            inline
                                        />
                                        <div className="csel-wizard-footer">
                                            <button
                                                type="button"
                                                className="csel-cancel-btn"
                                                onClick={defaultOpen ? closeModal : backToList}
                                            >
                                                {t.cancel}
                                            </button>
                                            <button
                                                type="button"
                                                className="csel-save-btn"
                                                onClick={() => setStep('details')}
                                            >
                                                {t.categoryNextBtn}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* Step 2 — name fields */
                                    <div className="csel-wizard-details">
                                        {/* Icon preview — click to go back to step 1 */}
                                        <div className="csel-add-field">
                                            <label>{t.categoryIconLabel}</label>
                                            <button
                                                type="button"
                                                className="csel-icon-preview-btn"
                                                onClick={() => setStep('icon')}
                                                title={isRtl ? 'לחץ לשינוי אייקון' : 'Click to change icon'}
                                            >
                                                {addForm.icon}
                                            </button>
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
                                                autoFocus
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
                                            {mode === 'edit' && onDeleteCategory && (
                                                <button
                                                    type="button"
                                                    className="csel-delete-btn"
                                                    onClick={handleDelete}
                                                    disabled={saving}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="csel-cancel-btn"
                                                onClick={defaultOpen ? closeModal : backToList}
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
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    )
}
