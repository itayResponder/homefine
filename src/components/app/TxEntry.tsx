// src/components/app/TxEntry.tsx
import { useI18n } from '../../i18n/context'
import { useMemberName } from '../../hooks/useMemberName'
import { CATEGORY_ICONS } from '../../constants/categories'
import { fmtDate } from '../../utils/format'
import { Money } from '../ui/Money'
import type { Member, Transaction } from '../../types'

interface Props {
    tx: Transaction
    members: Member[]
    onEdit: (tx: Transaction) => void
    onDelete: (tx: Transaction) => void
}

export function TxEntry({ tx, members, onEdit, onDelete }: Props) {
    const { t } = useI18n()
    const getMemberName = useMemberName()
    const isExpense = tx.type === 'expense'
    const isRecurring = Boolean(tx.recurringId)
    const member = members.find((m) => m.id === tx.memberId)
    const memberName = tx.memberId === 'shared' ? t.sharedLabel : (member ? getMemberName(member) : tx.memberId)
    const memberColor = member?.color ?? '#6C63FF'
    const tagStyle =
        tx.memberId === 'shared'
            ? { background: '#F5F5F4', color: '#78716C' }
            : { background: memberColor + '20', color: memberColor }

    return (
        <div className="entry">
            <div
                className="eico"
                style={{ background: isExpense ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}
            >
                {CATEGORY_ICONS[tx.category]}
            </div>
            <div className="einfo">
                <div className="ename">{tx.description}</div>
                <div className="emeta">
                    <span className="wtag" style={tagStyle}>{memberName}</span>
                    {tx.date && ` · ${fmtDate(tx.date)}`}
                    {' · '}{t.categoryNames[tx.category]}
                    {isRecurring && <span className="rec-badge">{t.recurringBadge}</span>}
                </div>
            </div>
            <span className={`eamt ${isExpense ? 'out' : 'in'}`}>
                <Money amount={tx.amount} sign={isExpense ? '−' : '+'} />
            </span>
            {isRecurring ? (
                <div style={{ width: 24 }} />
            ) : (
                <>
                    <button className="editbtn" onClick={() => onEdit(tx)} title="עריכה">✏</button>
                    <button className="delbtn" onClick={() => onDelete(tx)} title="מחיקה">✕</button>
                </>
            )}
        </div>
    )
}
