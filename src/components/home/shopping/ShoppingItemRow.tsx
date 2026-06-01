// src/components/home/shopping/ShoppingItemRow.tsx
import React from 'react'
import type { ShoppingItem } from '../../../types/home'
import type { Member } from '../../../types'

interface Props {
    item: ShoppingItem
    members: Member[]
    currentMemberId?: string
    onToggle: (id: string, done: boolean) => void
    onDelete: (id: string) => void
}

export function ShoppingItemRow({ item, members, currentMemberId, onToggle, onDelete }: Props) {
    const adder = members.find((m) => m.id === item.addedBy)

    return (
        <div className={`sir-row${item.done ? ' sir-row--done' : ''}`}>
            <button
                className="sir-check"
                onClick={() => onToggle(item.id, !item.done, currentMemberId)}
                aria-label={item.done ? 'Uncheck' : 'Check'}
                style={{ borderColor: item.done ? (adder?.color ?? '#2563EB') : undefined,
                         background: item.done ? (adder?.color ?? '#2563EB') : undefined }}
            >
                {item.done && <span className="sir-checkmark">✓</span>}
            </button>

            <div className="sir-content">
                <span className="sir-text">{item.text}</span>
                {adder && (
                    <span className="sir-adder" style={{ color: adder.color }}>
                        {adder.name}
                    </span>
                )}
            </div>

            <button
                className="sir-delete"
                onClick={() => onDelete(item.id)}
                aria-label="Delete"
            >
                ×
            </button>
        </div>
    )
}
