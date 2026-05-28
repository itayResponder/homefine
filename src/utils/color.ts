function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number) {
    return '#' + [r, g, b]
        .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
        .join('')
}

function mix(hex: string, whiteRatio: number) {
    const { r, g, b } = hexToRgb(hex)
    return rgbToHex(r + (255 - r) * whiteRatio, g + (255 - g) * whiteRatio, b + (255 - b) * whiteRatio)
}

function darken(hex: string, amount: number) {
    const { r, g, b } = hexToRgb(hex)
    return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

export const DEFAULT_COLOR = '#6C63FF'

export function buildColorVars(hex: string): Record<string, string> {
    return {
        '--ac': hex,
        '--acd': darken(hex, 0.15),
        '--acl': mix(hex, 0.885),
        '--ib': mix(hex, 0.71),
        '--ibg': mix(hex, 0.952),
        '--bg': mix(hex, 0.925),
    }
}
