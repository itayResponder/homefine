// src/components/ui/EmojiPicker.tsx
import { useState } from 'react'
import { EMOJI_GROUPS } from '../../constants/categories'
import './EmojiPicker.css'

interface Props {
    value: string
    onChange: (emoji: string) => void
    onClose: () => void
}

export function EmojiPicker({ value, onChange, onClose }: Props) {
    const [search, setSearch] = useState('')

    const allEmojis = EMOJI_GROUPS.flatMap(g => g.emojis)
    const filtered = search.trim()
        ? allEmojis.filter(e => e.includes(search.trim()))
        : null

    return (
        <div className="ep-backdrop" onClick={onClose}>
            <div className="ep-panel" onClick={e => e.stopPropagation()}>
                <input
                    className="ep-search"
                    placeholder="חפש אמוג'י..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                />
                <div className="ep-scroll">
                    {filtered ? (
                        <div className="ep-group">
                            {filtered.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className={`ep-btn${value === emoji ? ' ep-btn--active' : ''}`}
                                    onClick={() => { onChange(emoji); onClose() }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    ) : (
                        EMOJI_GROUPS.map(group => (
                            <div key={group.label}>
                                <div className="ep-group-label">{group.label}</div>
                                <div className="ep-group">
                                    {group.emojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={`ep-btn${value === emoji ? ' ep-btn--active' : ''}`}
                                            onClick={() => { onChange(emoji); onClose() }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
