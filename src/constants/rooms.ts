// src/constants/rooms.ts
import type { TaskRoom } from '../types/home'

interface RoomDef {
    icon: string
    labelHe: string
    labelEn: string
}

export const ROOM_DEFS: Record<TaskRoom, RoomDef> = {
    bathroom: { icon: '🚿', labelHe: 'אמבטיה',    labelEn: 'Bathroom'     },
    kitchen:  { icon: '🍳', labelHe: 'מטבח',      labelEn: 'Kitchen'      },
    living:   { icon: '🛋️', labelHe: 'סלון',      labelEn: 'Living Room'  },
    bedroom:  { icon: '🛏️', labelHe: 'חדר שינה',  labelEn: 'Bedroom'      },
    outdoor:  { icon: '🌿', labelHe: 'חוץ',       labelEn: 'Outdoor'      },
    general:  { icon: '🏠', labelHe: 'כללי',      labelEn: 'General'      },
}

export const ROOM_ORDER: TaskRoom[] = [
    'bathroom', 'kitchen', 'living', 'bedroom', 'outdoor', 'general',
]
