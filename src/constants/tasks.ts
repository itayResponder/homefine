// src/constants/tasks.ts
import type { useI18n } from '../i18n/context'

export const INTERVALS: { days: number; key: keyof ReturnType<typeof useI18n>['t']['home'] }[] = [
    { days: 0,  key: 'intervalOnce'    },
    { days: 1,  key: 'intervalDaily'   },
    { days: 2,  key: 'interval2Days'   },
    { days: 7,  key: 'intervalWeekly'  },
    { days: 14, key: 'interval2Weeks'  },
    { days: 30, key: 'intervalMonthly' },
]

export function getIntervalLabel(
    days: number,
    h: ReturnType<typeof useI18n>['t']['home'],
): string {
    const found = INTERVALS.find((i) => i.days === days)
    return found ? (h[found.key] as string) : `${days}`
}
