import { HexColorPicker, HexColorInput } from 'react-colorful'
import styles from './ColorPicker.module.css'

interface Props {
    value: string
    onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
    return (
        <div className={styles.colorPicker}>
            <HexColorPicker color={value} onChange={onChange} />
            <div className={styles.hexRow}>
                <span>#</span>
                <HexColorInput color={value} onChange={onChange} />
            </div>
        </div>
    )
}
