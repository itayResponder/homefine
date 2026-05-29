// src/components/ui/Money.tsx
import { formatCurrency } from '../../utils/format'

interface Props {
    amount: number   // always pass the absolute value; sign is separate
    sign?: string    // '+', '−', or '' (default: no sign)
}

export function Money({ amount, sign = '' }: Props) {
    return (
        <span dir="ltr" style={{ unicodeBidi: 'embed' }}>
            {formatCurrency(amount, undefined, sign)}
        </span>
    )
}
