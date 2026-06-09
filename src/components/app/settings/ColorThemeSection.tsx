import { useI18n } from '../../../i18n/context'
import styles from '../SettingsView.module.css'

const DEFAULT_COLOR = '#2563EB'

interface Props {
    primaryColor: string
    onColorChange: (color: string) => void
}

export function ColorThemeSection({ primaryColor, onColorChange }: Props) {
    const { t } = useI18n()

    return (
        <div className="fcard">
            <div className="fttl">🎨 {t.settings.colorThemeTitle}</div>
            <div className={styles.colorRow}>
                <div className={styles.colorPickerWrapper}>
                    <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => onColorChange(e.target.value)}
                        className={styles.colorInput}
                    />
                    <div className={styles.colorSwatch} style={{ background: primaryColor }} />
                </div>
                <div>
                    <div className={styles.colorHex}>{primaryColor.toUpperCase()}</div>
                    <div className={styles.colorHint}>{t.settings.colorThemeHint}</div>
                </div>
                {primaryColor !== DEFAULT_COLOR && (
                    <button
                        onClick={() => onColorChange(DEFAULT_COLOR)}
                        className={styles.colorResetBtn}
                    >
                        {t.settings.colorThemeReset}
                    </button>
                )}
            </div>
        </div>
    )
}
