// src/utils/format.ts

/**
 * Returns a formatted currency string.
 * RTL (Hebrew): sign + number + ' ₪'   e.g. "−1,000 ₪"
 * LTR (English): sign + '₪' + number   e.g. "−₪1,000"
 * Always wrap in <span dir="ltr"> when used in JSX to prevent bidi reordering.
 */
export function formatCurrency(amount: number, _dir?: string, sign = ''): string {
    const n = Math.round(Math.abs(amount)).toLocaleString()
    return `${sign}${n} ₪`
}

export function fmtDate(d: string): string {
    if (!d) return ''
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
}

export function memberInitial(name: string): string {
    return name[0] ?? '?'
}
