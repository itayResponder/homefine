// src/components/home/shopping/ShoppingView.tsx
import React, { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { ShoppingItemRow } from './ShoppingItemRow'
import type { ShoppingItem } from '../../../types/home'
import type { Member } from '../../../types'
import './ShoppingView.css'

interface Props {
    items: ShoppingItem[]
    members: Member[]
    currentMemberId?: string
    onAdd: (text: string) => void
    onToggle: (id: string, done: boolean) => void
    onDelete: (id: string) => void
    onClearDone: () => void
}

export function ShoppingView({ items, members, currentMemberId, onAdd, onToggle, onDelete, onClearDone }: Props) {
    const { t } = useI18n()
    const h = t.home
    const [text, setText] = useState('')

    const handleAdd = () => {
        if (!text.trim()) return
        onAdd(text.trim())
        setText('')
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd()
    }

    const undone = items.filter((i) => !i.done)
    const done = items.filter((i) => i.done)
    const hasDone = done.length > 0

    return (
        <div className="sv-root">
            {/* Quick-add */}
            <div className="sv-add-row">
                <input
                    className="inp sv-inp"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={h.shoppingPlaceholder}
                />
                <button
                    className="sbtn sv-add-btn"
                    onClick={handleAdd}
                    disabled={!text.trim()}
                >
                    {h.addItemBtn}
                </button>
            </div>

            {items.length === 0 ? (
                <p className="sv-empty">{h.noItems}</p>
            ) : (
                <div className="sv-list">
                    {undone.map((item) => (
                        <ShoppingItemRow
                            key={item.id}
                            item={item}
                            members={members}
                            currentMemberId={currentMemberId}
                            onToggle={onToggle}
                            onDelete={onDelete}
                        />
                    ))}

                    {hasDone && (
                        <>
                            <div className="sv-divider">
                                <span>{h.doneDivider}</span>
                                <button className="sv-clear" onClick={onClearDone}>
                                    {h.clearDone}
                                </button>
                            </div>
                            {done.map((item) => (
                                <ShoppingItemRow
                                    key={item.id}
                                    item={item}
                                    members={members}
                                    currentMemberId={currentMemberId}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
