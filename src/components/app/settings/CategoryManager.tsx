// src/components/app/settings/CategoryManager.tsx
import { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { CategorySelect } from '../../ui/CategorySelect'
import type { Category } from '../../../types'
import './CategoryManager.css'

interface Props {
    categories: Category[]
    onAdd: (cat: Omit<Category, 'id'>) => Promise<string>
    onUpdate: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

type Panel =
    | { mode: 'add' }
    | { mode: 'edit'; id: string }

export function CategoryManager({ categories, onAdd, onUpdate, onDelete }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'
    const [panel, setPanel] = useState<Panel | null>(null)

    const catName = (cat: Category) => isRtl ? cat.name : (cat.nameEn || cat.name)

    return (
        <div className="cm-root">
            {/* Category grid — reuses csel-* classes for visual consistency */}
            <div className="csel-grid cm-grid">
                {categories.map(cat => (
                    <div key={cat.id} className="csel-item-wrap">
                        <button
                            type="button"
                            className="csel-item"
                            onClick={() => setPanel({ mode: 'edit', id: cat.id })}
                        >
                            <span className="csel-item-icon">{cat.icon}</span>
                            <span className="csel-item-name">{catName(cat)}</span>
                        </button>
                        <button
                            type="button"
                            className="csel-item-edit-btn"
                            onClick={() => setPanel({ mode: 'edit', id: cat.id })}
                            aria-label="Edit category"
                        >✏️</button>
                    </div>
                ))}
            </div>

            <button type="button" className="cm-add-btn" onClick={() => setPanel({ mode: 'add' })}>
                {t.categoryAddBtn}
            </button>

            {panel && (
                <CategorySelect
                    categories={categories}
                    value={panel.mode === 'edit' ? panel.id : ''}
                    onChange={() => {}}
                    onAddCategory={onAdd}
                    onUpdateCategory={onUpdate}
                    onDeleteCategory={onDelete}
                    defaultOpen
                    defaultMode={panel.mode}
                    defaultEditId={panel.mode === 'edit' ? panel.id : undefined}
                    onClose={() => setPanel(null)}
                />
            )}
        </div>
    )
}
