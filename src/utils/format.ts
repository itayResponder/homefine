// src/utils/format.ts

export function fmt(n: number): string {
    return '₪' + Math.round(n).toLocaleString()
}

export function fmtDate(d: string): string {
    if (!d) return ''
    const [y, m, dd] = d.split('-')
    return `${dd}/${m}/${y}`
}

export function memberInitial(name: string): string {
    return name[0] ?? '?'
}
