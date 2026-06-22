// src/components/ui/AmountInput.tsx
import { useEffect, useRef, useState } from 'react'

function fmt(raw: string): string {
    if (!raw || raw === '-') return raw
    const isNeg = raw.startsWith('-')
    const abs = isNeg ? raw.slice(1) : raw
    const [int, dec] = abs.split('.')
    if (!int && int !== '0') return isNeg ? '-' : ''
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const formatted = dec !== undefined ? `${grouped}.${dec}` : grouped
    return isNeg ? `-${formatted}` : formatted
}

interface Props {
    value: string
    onChange: (raw: string) => void
    placeholder?: string
    required?: boolean
    className?: string
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
    autoFocus?: boolean
}

export function AmountInput({ value, onChange, placeholder, required, className, onKeyDown, autoFocus }: Props) {
    const [display, setDisplay] = useState(() => fmt(value))
    const lastRawRef = useRef(value)

    useEffect(() => {
        if (value !== lastRawRef.current) {
            lastRawRef.current = value
            setDisplay(fmt(value))
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '')
        if (raw !== '' && raw !== '-' && !/^-?\d*\.?\d*$/.test(raw)) return
        lastRawRef.current = raw
        setDisplay(fmt(raw))
        onChange(raw)
    }

    return (
        <input
            type="text"
            inputMode="decimal"
            className={className}
            value={display}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
        />
    )
}
