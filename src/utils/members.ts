import type { Member } from '../types'

export const getDefaultMemberId = (members: Member[], currentUserId: string | undefined): string =>
    members.find((m) => m.userId === currentUserId)?.id ?? 'shared'
