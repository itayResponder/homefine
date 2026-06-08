// src/components/ui/LanguageToggle.tsx
import { useI18n } from '../../i18n/context'
import type { Lang } from '../../i18n/types'
import './LanguageToggle.css'

export function LanguageToggle() {
    const { lang, setLang } = useI18n()

    const options: { value: Lang; label: string }[] = [
        { value: 'en', label: 'EN' },
        { value: 'he', label: 'עב' },
    ]

    return (
        <div className="lang-toggle" role="group" aria-label="Language">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    className={`lang-btn${lang === opt.value ? ' lang-btn--active' : ''}`}
                    onClick={() => setLang(opt.value)}
                    aria-pressed={lang === opt.value}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
