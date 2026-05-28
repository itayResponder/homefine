// src/i18n/context.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { en } from './en'
import { he } from './he'
import type { Lang, T } from './types'

const TRANSLATIONS: Record<Lang, T> = { en, he }

const STORAGE_KEY = 'homefine-lang'

function detectLang(): Lang {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'he') return saved
    return navigator.language.startsWith('he') ? 'he' : 'en'
}

interface I18nContextType {
    lang: Lang
    t: T
    setLang: (l: Lang) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, _setLang] = useState<Lang>(detectLang)

    const setLang = (l: Lang) => {
        _setLang(l)
        localStorage.setItem(STORAGE_KEY, l)
    }

    useEffect(() => {
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
        document.documentElement.lang = lang
    }, [lang])

    return (
        <I18nContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n(): I18nContextType {
    const ctx = useContext(I18nContext)
    if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
    return ctx
}
