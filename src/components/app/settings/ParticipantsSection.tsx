import { useI18n } from '../../../i18n/context'
import type { Participant } from '../../../types'
import styles from '../SettingsView.module.css'

function fmtJoinDate(ts: number): string {
    const d = new Date(ts)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

interface Props {
    participants: Participant[]
    currentUserId?: string
    onRemoveParticipant?: (uid: string) => void
}

export function ParticipantsSection({ participants, currentUserId, onRemoveParticipant }: Props) {
    const { t } = useI18n()
    return (
        <div className="fcard">
            <div className="fttl">🔑 {t.settings.accessTitle}</div>
            {participants.map((p) => (
                <div key={p.uid} className={styles.participantRow}>
                    {p.photoURL ? (
                        <img src={p.photoURL} alt={p.name} className={styles.participantAvatar} />
                    ) : (
                        <div className={styles.participantAvatarPlaceholder}>
                            {p.name[0]?.toUpperCase()}
                        </div>
                    )}
                    <div className={styles.participantInfo}>
                        <div className={styles.participantName}>
                            {p.name}
                            {p.uid === currentUserId && (
                                <span className={styles.ownerBadge}>
                                    {t.settings.ownerBadge}
                                </span>
                            )}
                        </div>
                        <div className={styles.participantEmail}>{p.email}</div>
                        <div className={styles.participantJoinDate}>
                            {t.settings.joinedLabel} {fmtJoinDate(p.joinedAt)}
                        </div>
                    </div>
                    {p.uid !== currentUserId && onRemoveParticipant && (
                        <button
                            onClick={() => onRemoveParticipant(p.uid)}
                            className={styles.removeParticipantBtn}
                        >
                            {t.settings.removeBtn}
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
