// src/hooks/useMemberName.ts
import { useI18n } from '../i18n/context'
import type { Member } from '../types'

/** Returns a function that resolves the display name based on the current locale. */
export function useMemberName() {
    const { t } = useI18n()
    return (member: Member): string =>
        t.locale.startsWith('en') && member.nameEn ? member.nameEn : member.name
}
