// src/utils/categories.ts
import { CATEGORY_ICONS } from '../constants/categories'
import type { Category } from '../types'

export function getCatIcon(categories: Category[], id: string): string {
    return categories.find(c => c.id === id)?.icon ?? CATEGORY_ICONS[id] ?? '❓'
}

export function getCatName(categories: Category[], id: string, locale: string): string {
    const cat = categories.find(c => c.id === id)
    if (!cat) return id
    return locale === 'he-IL' ? cat.name : (cat.nameEn || cat.name)
}

export function categoriesToOptions(cats: Category[], locale: string): { value: string; label: string }[] {
    return cats.map(c => ({
        value: c.id,
        label: `${c.icon} ${locale === 'he-IL' ? c.name : (c.nameEn || c.name)}`,
    }))
}
