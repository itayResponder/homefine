// src/components/ui/CustomDatePicker.tsx
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/context'

const DOW_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DOW_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
    value: string      // YYYY-MM-DD
    onChange: (v: string) => void
}

function parseISO(s: string): { y: number; m: number; d: number } {
    const [y, m, d] = s.split('-').map(Number)
    return { y, m: m - 1, d }   // m is 0-indexed
}

function fmtDisplay(s: string, locale: string): string {
    if (!s) return ''
    const { y, m, d } = parseISO(s)
    if (locale.startsWith('he')) {
        return `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`
    }
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function CustomDatePicker({ value, onChange }: Props) {
    const { t } = useI18n()
    const isHe = t.locale.startsWith('he')
    const DOW = isHe ? DOW_HE : DOW_EN

    const { y: selY, m: selM, d: selD } = parseISO(value)
    const [open, setOpen] = useState(false)
    const [navY, setNavY] = useState(selY)
    const [navM, setNavM] = useState(selM)
    const wrapRef = useRef<HTMLDivElement>(null)
    const today = new Date()

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler, true)
        return () => document.removeEventListener('mousedown', handler, true)
    }, [])

    const handleOpen = () => {
        if (!open) { setNavY(selY); setNavM(selM) }
        setOpen((v) => !v)
    }

    const navMonth = (dir: number) => {
        setNavM((m) => {
            let nm = m + dir
            if (nm > 11) { nm = 0; setNavY((y) => y + 1) }
            else if (nm < 0) { nm = 11; setNavY((y) => y - 1) }
            return nm
        })
    }

    const pickDay = (d: number) => {
        const iso = `${navY}-${String(navM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        onChange(iso)
        setOpen(false)
    }

    const firstWeekday = new Date(navY, navM, 1).getDay()
    const daysInMonth = new Date(navY, navM + 1, 0).getDate()
    const cells: (number | null)[] = [
        ...Array(firstWeekday).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]

    const monthLabel = `${t.monthNames[navM]} ${navY}`

    return (
        <div className="cd-wrap" ref={wrapRef}>
            <div className={`cd-trig${open ? ' open' : ''}`} onClick={handleOpen}>
                <span style={{ fontSize: 14, color: '#9490CC' }}>📅</span>
                <span>{fmtDisplay(value, t.locale)}</span>
                <span className="arr">{open ? '▲' : '▼'}</span>
            </div>

            {open && (
                <div className="cd-pop">
                    <div className="cd-nav">
                        <button className="cd-nbtn" type="button" onClick={() => navMonth(-1)}>‹</button>
                        <span className="cd-mlbl">{monthLabel}</span>
                        <button className="cd-nbtn" type="button" onClick={() => navMonth(1)}>›</button>
                    </div>
                    <div className="cd-grid">
                        {DOW.map((d) => <div key={d} className="cd-dow">{d}</div>)}
                        {cells.map((d, i) => {
                            if (d === null) return <div key={`e${i}`} className="cd-day empty" />
                            const isSel = d === selD && navM === selM && navY === selY
                            const isToday =
                                d === today.getDate() &&
                                navM === today.getMonth() &&
                                navY === today.getFullYear()
                            return (
                                <div
                                    key={d}
                                    className={`cd-day${isSel ? ' sel' : isToday ? ' today' : ''}`}
                                    onClick={() => pickDay(d)}
                                >
                                    {d}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
