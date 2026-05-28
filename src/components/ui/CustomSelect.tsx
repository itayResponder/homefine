// src/components/ui/CustomSelect.tsx
import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
    value: string
    label: string
}

interface Props {
    options: SelectOption[]
    value: string
    onChange: (v: string) => void
}

export function CustomSelect({ options, value, onChange }: Props) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const selected = options.find((o) => o.value === value)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler, true)
        return () => document.removeEventListener('mousedown', handler, true)
    }, [])

    return (
        <div className="cs-wrap" ref={wrapRef}>
            <div
                className={`cs-trig${open ? ' open' : ''}`}
                onClick={() => setOpen((v) => !v)}
            >
                <span>{selected?.label ?? value}</span>
                <span className="arr">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
                <div className="cs-dd">
                    {options.map((o) => (
                        <div
                            key={o.value}
                            className={`cs-item${value === o.value ? ' active' : ''}`}
                            onClick={() => { onChange(o.value); setOpen(false) }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
