import { useI18n } from '../../../i18n/context'
import { ColorPicker } from '../../ui/ColorPicker'
import { DEFAULT_COLOR } from '../../../utils/color'
import styles from '../SettingsView.module.css'

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
                <ColorPicker value={primaryColor} onChange={onColorChange} />
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
