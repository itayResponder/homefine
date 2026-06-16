import { useState, useRef, useEffect } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import './ColorPicker.css'

const PRESET_COLORS = [
    '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
    '#EA580C', '#D97706', '#65A30D', '#16A34A',
    '#0891B2', '#0284C7', '#4F46E5', '#9333EA',
    '#EC4899', '#F43F5E', '#14B8A6', '#8B5CF6',
]

interface Props {
    value: string
    onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
    const [open, setOpen] = useState(false)
    const [hexInput, setHexInput] = useState(value)
    const rootRef = useRef<HTMLDivElement>(null)

    useClickOutside(rootRef, () => setOpen(false))

    useEffect(() => { setHexInput(value) }, [value])

    const handleHexChange = (raw: string) => {
        setHexInput(raw)
        const hex = raw.startsWith('#') ? raw : '#' + raw
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onChange(hex.toLowerCase())
        }
    }

    const handleHexBlur = () => {
        const hex = hexInput.startsWith('#') ? hexInput : '#' + hexInput
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            setHexInput(value)
        }
    }

    return (
        <div className="cp-root" ref={rootRef}>
            <button
                type="button"
                className="cp-swatch-btn"
                style={{ background: value }}
                onClick={() => setOpen(o => !o)}
                aria-label="בחר צבע"
            />
            {open && (
                <>
                    <div className="cp-backdrop" onClick={() => setOpen(false)} />
                    <div className="cp-panel">
                        <div className="cp-grid">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`cp-preset${c.toLowerCase() === value.toLowerCase() ? ' cp-preset--active' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => { onChange(c); setOpen(false) }}
                                    aria-label={c}
                                />
                            ))}
                        </div>
                        <div className="cp-hex-row">
                            <div className="cp-hex-preview" style={{ background: value }} />
                            <input
                                className="cp-hex-input"
                                value={hexInput}
                                onChange={e => handleHexChange(e.target.value)}
                                onBlur={handleHexBlur}
                                maxLength={7}
                                spellCheck={false}
                                dir="ltr"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
