// src/utils/date.ts

export function todayISO(): string {
    return new Date().toISOString().split('T')[0]
}

export function currentMonth(): string {
    return todayISO().slice(0, 7)
}

export function formatMonth(ym: string, locale = 'en-US'): string {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleString(locale, {
        month: 'long',
        year: 'numeric',
    })
}

export function shiftMonth(ym: string, delta: number): string {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function fmtJoinDate(ts: number): string {
    const d = new Date(ts)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
