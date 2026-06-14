// src/components/ui/EmojiPicker.tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { EMOJI_GROUPS } from '../../constants/categories'
import { useI18n } from '../../i18n/context'
import './EmojiPicker.css'

interface Props {
    value: string
    onChange: (emoji: string) => void
    onClose: () => void
    anchorRect?: DOMRect | null
    inline?: boolean
}

export function EmojiPicker({ value, onChange, onClose, anchorRect, inline }: Props) {
    const { t } = useI18n()
    const [search, setSearch] = useState('')

    const q = search.trim().toLowerCase()
    const filteredGroups = q
        ? EMOJI_GROUPS.filter(g =>
            g.label.includes(q) || g.labelEn.toLowerCase().includes(q)
          )
        : null

    const content = (
        <>
            <input
                className="ep-search"
                placeholder={t.emojiSearchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus={!inline}
            />
            <div className="ep-scroll">
                {(filteredGroups ?? EMOJI_GROUPS).map(group => (
                    <div key={group.label}>
                        <div className="ep-group-label">{group.label}</div>
                        <div className="ep-group">
                            {group.emojis.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className={`ep-btn${value === emoji ? ' ep-btn--active' : ''}`}
                                    onClick={() => { onChange(emoji); if (!inline) onClose() }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )

    if (inline) {
        return <div className="ep-inline">{content}</div>
    }

    const isRtl = document.documentElement.dir === 'rtl'
    const panelStyle: React.CSSProperties = anchorRect
        ? {
            position: 'fixed',
            top: anchorRect.bottom + 6,
            zIndex: 9999,
            ...(isRtl
                ? { right: window.innerWidth - anchorRect.right }
                : { left: anchorRect.left }),
          }
        : { position: 'fixed', top: 120, left: 120, zIndex: 9999 }

    return createPortal(
        <>
            <div className="ep-backdrop" onClick={onClose} />
            <div className="ep-panel" style={panelStyle} onClick={e => e.stopPropagation()}>
                {content}
            </div>
        </>,
        document.body
    )
}
