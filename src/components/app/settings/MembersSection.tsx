import { useState } from 'react'
import { useI18n } from '../../../i18n/context'
import type { Member } from '../../../types'
import { EditMemberModal } from './EditMemberModal'
import styles from '../SettingsView.module.css'

interface Props {
    members: Member[]
    currentUserId?: string
    onRemoveMember: (id: string) => void
    onRenameMember: (id: string, name: string, nameEn?: string) => void
}

export function MembersSection({ members, currentUserId, onRemoveMember, onRenameMember }: Props) {
    const { t } = useI18n()
    const [editingMember, setEditingMember] = useState<Member | null>(null)

    return (
        <>
            <div className="fcard">
                <div className="fttl">👥 {t.membersLabel}</div>
                {members.length > 0 && (
                    <div className={`catchips ${styles.memberChips}`}>
                        {members.map((m) => (
                            <div key={m.id} className="catchip" style={{ border: `1.5px solid ${m.color}40`, color: m.color, background: m.color + '15' }}>
                                <span className={styles.memberColorDot} style={{ background: m.color }} />
                                {m.name}
                                {m.userId === currentUserId && (
                                    <button
                                        onClick={() => setEditingMember(m)}
                                        title={t.settings.editNameTitle}
                                        className={styles.memberEditBtn}
                                    >✏️</button>
                                )}
                                <button onClick={() => onRemoveMember(m.id)} title="מחק חבר">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {editingMember && (
                <EditMemberModal
                    member={editingMember}
                    onSave={(name, nameEn) => { onRenameMember(editingMember.id, name, nameEn); setEditingMember(null) }}
                    onClose={() => setEditingMember(null)}
                />
            )}
        </>
    )
}
