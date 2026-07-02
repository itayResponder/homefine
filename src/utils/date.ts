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

// ── Billing cycle (מחזור חיוב) ──────────────────────────────────────────────
// כרגע קבוע ל-10 לכל המשתמשים. בעתיד יהפוך לפרמטר פר-משתמש.
const BILLING_CYCLE_DAY = 10

function pad2(n: number): string {
    return String(n).padStart(2, '0')
}

function toISO(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * מחזיר את ה-label (YYYY-MM) של מחזור החיוב שאליו שייך תאריך נתון.
 * דוגמה: 2026-07-02 -> "2026-07" (יום < 10, שייך למחזור החודש הנוכחי)
 *        2026-07-15 -> "2026-08" (יום >= 10, שייך למחזור החודש הבא)
 */
export function getBillingCycleLabel(dateISO: string): string {
    const [y, m, d] = dateISO.split('-').map(Number)
    if (d >= BILLING_CYCLE_DAY) {
        const next = new Date(y, m, 1) // m הוא כבר האינדקס של החודש הבא (0-based)
        return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`
    }
    return `${y}-${pad2(m)}`
}

/**
 * מחזיר את טווח התאריכים (ISO) של מחזור חיוב לפי label בפורמט YYYY-MM.
 * start כולל, end לא כולל (exclusive) — כלומר end עצמו כבר שייך למחזור הבא.
 */
export function getBillingCycleRange(monthLabel: string): { start: string; end: string } {
    const [y, m] = monthLabel.split('-').map(Number)
    const start = new Date(y, m - 2, BILLING_CYCLE_DAY) // 10 בחודש שלפני חודש ה-label
    const end = new Date(y, m - 1, BILLING_CYCLE_DAY)    // 10 בחודש ה-label עצמו
    return { start: toISO(start), end: toISO(end) }
}

/** בודק האם תאריך עסקה (YYYY-MM-DD) נמצא בתוך מחזור החיוב של ה-label הנתון */
export function isInBillingCycle(dateISO: string, monthLabel: string): boolean {
    const { start, end } = getBillingCycleRange(monthLabel)
    return dateISO >= start && dateISO < end
}

/** מחזור החיוב הנוכחי (label בפורמט YYYY-MM), מחליף את השימוש ב-currentMonth() למסכי הכספים */
export function currentBillingCycle(): string {
    return getBillingCycleLabel(todayISO())
}

// ── Income cycle (מחזור הכנסות) ─────────────────────────────────────────────
// הכנסה שנכנסה בחודש קלנדרי X מוצגת תמיד במחזור החודש הבא (X+1),
// ללא תלות ביום בחודש. שונה מכלל ה-billing cycle שמשמש להוצאות.

/** מחזיר את ה-label (YYYY-MM) של מחזור ההכנסה: החודש הקלנדרי של התאריך, ועוד חודש אחד */
export function getIncomeCycleLabel(dateISO: string): string {
    const calendarMonth = dateISO.slice(0, 7) // YYYY-MM
    return shiftMonth(calendarMonth, 1)
}

/** בודק האם תאריך הכנסה (YYYY-MM-DD) שייך למחזור ה-label הנתון */
export function isInIncomeCycle(dateISO: string, monthLabel: string): boolean {
    return getIncomeCycleLabel(dateISO) === monthLabel
}

/**
 * בודק האם עסקה שייכת למחזור הנתון, לפי הכלל המתאים לסוג שלה:
 * expense -> מחזור חיוב (10 בחודש), income -> חודש קלנדרי +1.
 * זו נקודת הכניסה היחידה שצריך להשתמש בה בקומפוננטות התצוגה.
 */
export function isInFinanceCycle(dateISO: string, type: 'income' | 'expense', monthLabel: string): boolean {
    return type === 'income'
        ? isInIncomeCycle(dateISO, monthLabel)
        : isInBillingCycle(dateISO, monthLabel)
}
