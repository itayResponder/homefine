// src/constants/categories.ts
import type { Category } from '../types'

// Static fallback icons — used during initial load before Firebase data arrives
export const CATEGORY_ICONS: Record<string, string> = {
    rent: '🏠',
    electricity: '💡',
    water: '💧',
    gas: '🔥',
    internet: '📶',
    mobile: '📱',
    property_tax: '🏛️',
    food: '🛒',
    entertainment: '🎉',
    health: '❤️',
    clothing: '👗',
    transport: '🚗',
    education: '📚',
    baby: '🍼',
    loan: '💳',
    salary: '💼',
    bills: '🧾',
    pet: '🐾',
    other: '💰',
    automation: '⚡',
}

// Default categories seeded into Firebase for new households (same IDs as hardcoded originals)
export const DEFAULT_CATEGORY_SEEDS: Category[] = [
    { id: 'rent', name: 'שכר דירה', nameEn: 'Rent', icon: '🏠', order: 0 },
    { id: 'electricity', name: 'חשמל', nameEn: 'Electricity', icon: '💡', order: 1 },
    { id: 'water', name: 'מים', nameEn: 'Water', icon: '💧', order: 2 },
    { id: 'gas', name: 'גז', nameEn: 'Gas', icon: '🔥', order: 3 },
    { id: 'internet', name: 'אינטרנט', nameEn: 'Internet', icon: '📶', order: 4 },
    { id: 'mobile', name: 'סלולר', nameEn: 'Mobile', icon: '📱', order: 5 },
    { id: 'property_tax', name: 'ארנונה', nameEn: 'Property Tax', icon: '🏛️', order: 6 },
    { id: 'food', name: 'מזון', nameEn: 'Food', icon: '🛒', order: 7 },
    { id: 'entertainment', name: 'בילויים', nameEn: 'Entertainment', icon: '🎉', order: 8 },
    { id: 'health', name: 'בריאות', nameEn: 'Health', icon: '❤️', order: 9 },
    { id: 'clothing', name: 'ביגוד', nameEn: 'Clothing', icon: '👗', order: 10 },
    { id: 'transport', name: 'תחבורה', nameEn: 'Transport', icon: '🚗', order: 11 },
    { id: 'education', name: 'חינוך', nameEn: 'Education', icon: '📚', order: 12 },
    { id: 'baby', name: 'תינוק', nameEn: 'Baby', icon: '🍼', order: 13 },
    { id: 'loan', name: 'הלוואה', nameEn: 'Loan', icon: '💳', order: 14 },
    { id: 'salary', name: 'משכורת', nameEn: 'Salary', icon: '💼', order: 15 },
    { id: 'bills', name: 'חשבונות', nameEn: 'Bills', icon: '🧾', order: 16 },
    { id: 'pet', name: 'חיית מחמד', nameEn: 'Pet', icon: '🐾', order: 17 },
    { id: 'other', name: 'אחר', nameEn: 'Other', icon: '💰', order: 18 },
    { id: 'automation', name: 'אוטומציה', nameEn: 'Automation', icon: '⚡', order: 19 },
]

// Curated emoji list for the picker — grouped by theme
export const EMOJI_GROUPS: { label: string; labelEn: string; emojis: string[] }[] = [
    { label: 'דיור', labelEn: 'Housing', emojis: ['🏠', '🏡', '🏢', '🔑', '🛋️', '🛏️', '🪟', '🚪'] },
    { label: 'חשמל / מים', labelEn: 'Electricity / Water', emojis: ['💡', '🔌', '💧', '🔥', '🌡️', '♻️'] },
    { label: 'אוכל', labelEn: 'Food', emojis: ['🛒', '🍕', '🥗', '🍔', '🥩', '☕', '🍰', '🥦', '🧃', '🍺', '🍽️', '🧁'] },
    { label: 'תחבורה', labelEn: 'Transport', emojis: ['🚗', '🚌', '✈️', '⛽', '🚲', '🛵', '🚂', '🛳️'] },
    { label: 'בריאות', labelEn: 'Health', emojis: ['💊', '🏥', '🩺', '🦷', '👓', '🧴', '🧘', '🩻'] },
    { label: 'בידור', labelEn: 'Entertainment', emojis: ['🎬', '🎮', '🎵', '📺', '🎨', '🏋️', '⚽', '🎯', '🎭', '🥂', '🍷'] },
    { label: 'חינוך', labelEn: 'Education', emojis: ['📚', '📖', '✏️', '🎓', '🏫', '🖊️'] },
    { label: 'ילדים', labelEn: 'Children', emojis: ['👶', '🍼', '🧸', '🎠', '🧩', '🎀'] },
    { label: 'כסף', labelEn: 'Money', emojis: ['💰', '💳', '🏦', '💸', '🧾', '📈', '💼'] },
    { label: 'בית', labelEn: 'Home', emojis: ['🧹', '🧺', '🪴', '🛁', '🚿', '🔧', '🪛', '🧰'] },
    { label: 'ביגוד', labelEn: 'Clothing', emojis: ['👗', '👕', '👟', '🧥', '👜', '🧣'] },
    { label: 'חיות', labelEn: 'Pets', emojis: ['🐾', '🐕', '🐈', '🐇', '🐠'] },
    { label: 'שונות', labelEn: 'Misc', emojis: ['🎁', '📱', '📶', '🏛️', '⭐', '🌟', '🔒', '📦', '⚡'] },
]
