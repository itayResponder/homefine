// src/components/app/SettingsView.tsx
import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/context'
import { CATEGORY_ICONS } from '../../constants/categories'
import { EditMemberModal } from './EditMemberModal'
import { saveWebhookConfig, deleteWebhookConfig, subscribeWebhookConfig } from '../../firebase/db'
import type { HouseholdMeta, HouseholdSettings, LogEntry, Member, Participant, RecurringCharge, Transaction, TransactionCategory, WebhookConfig } from '../../types'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? ''

interface Props {
    householdId: string
    transactions: Transaction[]
    recurringCharges: RecurringCharge[]
    members: Member[]
    logs: LogEntry[]
    onRemoveMember: (id: string) => void
    primaryColor: string
    onColorChange: (color: string) => void
    // Owner controls
    isOwner: boolean
    meta: HouseholdMeta | null
    onUpdateSettings: (s: Partial<HouseholdSettings>) => void
    onRename: (name: string) => void
    // Income privacy
    currentUserId?: string
    onToggleMemberIncome: (member: Member) => void
    // Participants (owner only)
    participants?: Participant[]
    onRemoveParticipant?: (uid: string) => void
    onRenameMember: (id: string, name: string, nameEn?: string) => void
}

const DEFAULT_COLOR = '#2563EB'

function fmtJoinDate(ts: number): string {
    const d = new Date(ts)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function SettingsView({
    householdId,
    transactions, recurringCharges, members, logs,
    onRemoveMember, primaryColor, onColorChange,
    isOwner, meta, onUpdateSettings, onRename,
    currentUserId, onToggleMemberIncome,
    participants, onRemoveParticipant,
    onRenameMember,
}: Props) {
    const { t } = useI18n()
    const categories = Object.entries(t.categoryOptions) as [TransactionCategory, string][]

    const handleExport = () => {
        const data = { transactions, recurringCharges, members, logs }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'homefine-export.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    const isRtl = t.dir === 'rtl'
    const [renaming, setRenaming] = useState(false)
    const [newHouseName, setNewHouseName] = useState(meta?.name ?? '')
    const [editingMember, setEditingMember] = useState<Member | null>(null)
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
    const [showKey, setShowKey] = useState(false)
    const [showInstructions, setShowInstructions] = useState(false)
    const [webhookSaving, setWebhookSaving] = useState(false)

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault()
        const n = newHouseName.trim()
        if (n && n !== meta?.name) onRename(n)
        setRenaming(false)
    }

    const myMember = members.find(m => m.userId === currentUserId)

    useEffect(() => {
        if (!currentUserId) return
        return subscribeWebhookConfig(currentUserId, householdId, setWebhookConfig)
    }, [currentUserId, householdId])

    const handleGenerateKey = async () => {
        if (!currentUserId || !myMember) return
        setWebhookSaving(true)
        const apiKey = crypto.randomUUID()
        await saveWebhookConfig(
            currentUserId,
            householdId,
            { apiKey, householdId, memberId: myMember.id },
            webhookConfig?.apiKey,
        )
        setShowKey(true)
        setWebhookSaving(false)
    }

    const handleDeleteConfig = async () => {
        if (!currentUserId || !webhookConfig) return
        await deleteWebhookConfig(currentUserId, householdId, webhookConfig.apiKey)
        setShowKey(false)
    }

    return (
        <div>
            {/* ── Owner controls ─────────────────────────────────── */}
            {isOwner && (
                <div className="fcard" style={{ borderColor: 'var(--ac)', background: 'var(--acl)' }}>
                    <div className="fttl">👑 {isRtl ? 'הגדרות בעלים' : 'Owner Settings'}</div>

                    {/* Rename */}
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9490CC', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                            {isRtl ? 'שם הבית' : 'Household name'}
                        </div>
                        {renaming ? (
                            <form onSubmit={handleRename} style={{ display: 'flex', gap: 8 }}>
                                <input className="inp" value={newHouseName} onChange={e => setNewHouseName(e.target.value)} autoFocus required style={{ flex: 1 }} />
                                <button type="submit" className="sbtn" style={{ width: 'auto', padding: '10px 16px' }}>✓</button>
                                <button type="button" onClick={() => setRenaming(false)} style={{ padding: '10px 12px', border: '1.5px solid var(--ib)', borderRadius: 'var(--rs)', background: 'var(--ibg)', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{meta?.name}</span>
                                <button onClick={() => { setNewHouseName(meta?.name ?? ''); setRenaming(true) }} style={{ fontSize: 11, padding: '4px 10px', border: '1.5px solid var(--ib)', borderRadius: 20, background: '#fff', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {isRtl ? 'שנה שם' : 'Rename'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Expenses-only toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                                {isRtl ? 'מצב הוצאות בלבד' : 'Expenses-only mode'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9490CC', marginTop: 2 }}>
                                {isRtl ? 'מסתיר את לשונית ההכנסות מכל חברי הבית' : 'Hides the income tab for all members'}
                            </div>
                        </div>
                        <button
                            onClick={() => onUpdateSettings({ expensesOnly: !meta?.settings?.expensesOnly })}
                            style={{
                                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: meta?.settings?.expensesOnly ? 'var(--ac)' : '#E2E8F0',
                                transition: 'background .2s', flexShrink: 0, position: 'relative',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                transition: 'inset-inline-start .2s',
                                insetInlineStart: meta?.settings?.expensesOnly ? 23 : 3,
                            }} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Household participants ─────────────────────────── */}
            {isOwner && participants && participants.length > 0 && (
                <div className="fcard">
                    <div className="fttl">🔑 {isRtl ? 'גישה לבית' : 'Household Access'}</div>
                    {participants.map((p, i) => (
                        <div key={p.uid} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 0',
                            borderBottom: i < participants.length - 1 ? '1px solid #F1F5F9' : 'none',
                        }}>
                            {p.photoURL ? (
                                <img src={p.photoURL} alt={p.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--acl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--ac)', flexShrink: 0 }}>
                                    {p.name[0]?.toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {p.name}
                                    {p.uid === currentUserId && (
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac)', background: 'var(--acl)', padding: '2px 6px', borderRadius: 20 }}>
                                            {isRtl ? 'בעלים' : 'Owner'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{p.email}</div>
                                <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 1 }}>{isRtl ? 'הצטרף' : 'Joined'} {fmtJoinDate(p.joinedAt)}</div>
                            </div>
                            {p.uid !== currentUserId && onRemoveParticipant && (
                                <button
                                    onClick={() => onRemoveParticipant(p.uid)}
                                    style={{
                                        padding: '5px 10px', fontSize: 11, fontWeight: 600,
                                        borderRadius: 'var(--rs)', border: '1.5px solid #FECDD3',
                                        background: '#FFF1F2', color: '#E11D48',
                                        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                                    }}
                                >
                                    {isRtl ? 'הסר' : 'Remove'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── My income privacy ─────────────────────────────── */}
            {myMember && (
                <div className="fcard">
                    <div className="fttl">🔒 {isRtl ? 'פרטיות הכנסות' : 'Income Privacy'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                                {isRtl ? 'הסתר את ההכנסות שלי' : 'Hide my income'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9490CC', marginTop: 2 }}>
                                {isRtl ? 'רק אני אראה את ההכנסות שלי' : 'Only I can see my income'}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleMemberIncome(myMember)}
                            style={{
                                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: myMember.privateIncome ? 'var(--ac)' : '#E2E8F0',
                                transition: 'background .2s', flexShrink: 0, position: 'relative',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                transition: 'inset-inline-start .2s',
                                insetInlineStart: myMember.privateIncome ? 23 : 3,
                            }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Member management */}
            <div className="fcard">
                <div className="fttl">👥 {t.membersLabel}</div>
                {members.length > 0 && (
                    <div className="catchips" style={{ marginBottom: 12 }}>
                        {members.map((m) => (
                            <div key={m.id} className="catchip" style={{ border: `1.5px solid ${m.color}40`, color: m.color, background: m.color + '15' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block', flexShrink: 0 }} />
                                {m.name}
                                {m.userId === currentUserId && (
                                    <button
                                        onClick={() => setEditingMember(m)}
                                        title={isRtl ? 'שנה שם' : 'Edit name'}
                                        style={{ fontSize: 11, lineHeight: 1, opacity: 0.7 }}
                                    >✏️</button>
                                )}
                                <button onClick={() => onRemoveMember(m.id)} title="מחק חבר">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Categories */}
            <div className="fcard">
                <div className="fttl">{t.categoriesLabel}</div>
                <div className="catchips">
                    {categories.map(([k]) => (
                        <div key={k} className="catchip">
                            <span>{CATEGORY_ICONS[k as TransactionCategory]}</span>
                            {t.categoryNames[k as TransactionCategory]}
                        </div>
                    ))}
                </div>
            </div>

            {/* Color theme */}
            <div className="fcard">
                <div className="fttl">🎨 {t.dir === 'rtl' ? 'צבע ראשי' : 'Primary Color'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <div style={{ position: 'relative', width: 44, height: 44 }}>
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => onColorChange(e.target.value)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                border: 'none',
                                padding: 0,
                            }}
                        />
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: primaryColor,
                            border: '2px solid rgba(0,0,0,0.1)',
                            pointerEvents: 'none',
                        }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac)', marginBottom: 2 }}>
                            {primaryColor.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            {t.dir === 'rtl' ? 'לחץ לשינוי הצבע' : 'Click to change color'}
                        </div>
                    </div>
                    {primaryColor !== DEFAULT_COLOR && (
                        <button
                            onClick={() => onColorChange(DEFAULT_COLOR)}
                            style={{
                                marginRight: 'auto',
                                padding: '6px 12px',
                                fontSize: 11,
                                fontWeight: 600,
                                borderRadius: 'var(--rs)',
                                border: '1.5px solid var(--ib)',
                                background: 'var(--ibg)',
                                color: 'var(--ac)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {t.dir === 'rtl' ? 'איפוס' : 'Reset'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Automation ─────────────────────────────────────── */}
            {currentUserId && myMember && (
                <div className="fcard">
                    <div className="fttl">⚡ {isRtl ? 'אוטומציה — Google Wallet' : 'Automation — Google Wallet'}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.5 }}>
                        {isRtl
                            ? 'חבר את MacroDroid כדי שכל רכישה ב-Google Wallet תיכנס אוטומטית לאפליקציה.'
                            : 'Connect MacroDroid so every Google Wallet purchase is added automatically.'}
                    </div>

                    {webhookConfig ? (
                        <>
                            {/* Webhook URL */}
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9490CC', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                                    Webhook URL
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <code style={{ fontSize: 10, background: '#F1F5F9', padding: '6px 8px', borderRadius: 6, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', display: 'block' }}>
                                        {WEBHOOK_URL}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(WEBHOOK_URL)}
                                        style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--ibg)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                                    >
                                        {isRtl ? 'העתק' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* API Key */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9490CC', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                                    API Key
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <code style={{ fontSize: 10, background: '#F1F5F9', padding: '6px 8px', borderRadius: 6, flex: 1, fontFamily: 'monospace', direction: 'ltr', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {showKey ? webhookConfig.apiKey : '••••••••-••••-••••-••••-••••••••••••'}
                                    </code>
                                    <button
                                        onClick={() => setShowKey(s => !s)}
                                        style={{ padding: '6px 8px', fontSize: 13, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--ibg)', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        {showKey ? '🙈' : '👁'}
                                    </button>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(webhookConfig.apiKey)}
                                        style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--ibg)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                                    >
                                        {isRtl ? 'העתק' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                <button
                                    onClick={handleGenerateKey}
                                    disabled={webhookSaving}
                                    style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--ibg)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                    {isRtl ? '🔄 צור מפתח חדש' : '🔄 Regenerate Key'}
                                </button>
                                <button
                                    onClick={handleDeleteConfig}
                                    style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, borderRadius: 'var(--rs)', border: '1.5px solid #FECDD3', background: '#FFF1F2', color: '#E11D48', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                    {isRtl ? 'מחק' : 'Delete'}
                                </button>
                            </div>

                            {/* MacroDroid instructions */}
                            <button
                                onClick={() => setShowInstructions(s => !s)}
                                style={{ width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: showInstructions ? 'var(--acl)' : 'var(--ibg)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left' }}
                            >
                                📱 {isRtl ? 'הוראות הגדרה — MacroDroid' : 'MacroDroid Setup Guide'} {showInstructions ? '▲' : '▼'}
                            </button>

                            {showInstructions && (
                                <div style={{ marginTop: 10, fontSize: 12, color: '#334155', lineHeight: 1.7, background: '#F8FAFC', borderRadius: 8, padding: '12px 14px' }}>
                                    {isRtl ? (
                                        <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                                            <li>פתח MacroDroid ← לחץ <b>Add Macro</b></li>
                                            <li>Triggers ← לחץ <b>+</b> ← חפש <b>notification</b> ← <b>Device Events → Notification → Notification Received</b> ← בחר <b>Google Wallet</b></li>
                                            <li>Actions ← לחץ <b>+</b> ← <b>Web Interactions → HTTP Request</b></li>
                                            <li>שנה Method ל-<b>POST</b> ← הכנס URL מלמעלה</li>
                                            <li>לחץ טאב <b>Content Body</b> ← Content Type: <b>application/json</b></li>
                                            <li>הדבק את ה-Body:</li>
                                        </ol>
                                    ) : (
                                        <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                                            <li>Open MacroDroid → tap <b>Add Macro</b></li>
                                            <li>Triggers → tap <b>+</b> → search <b>notification</b> → <b>Device Events → Notification → Notification Received</b> → select <b>Google Wallet</b></li>
                                            <li>Actions → tap <b>+</b> → <b>Web Interactions → HTTP Request</b></li>
                                            <li>Change Method to <b>POST</b> → enter URL above</li>
                                            <li>Tap <b>Content Body</b> tab → Content Type: <b>application/json</b></li>
                                            <li>Paste the Body:</li>
                                        </ol>
                                    )}
                                    <pre style={{ marginTop: 8, background: '#1E293B', color: '#E2E8F0', borderRadius: 6, padding: '10px 12px', fontSize: 10, overflowX: 'auto', direction: 'ltr' }}>{`{
  "title": "%%ntitle%%",
  "body": "%%ntbody%%",
  "apiKey": "${webhookConfig.apiKey}"
}`}</pre>
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={handleGenerateKey}
                            disabled={webhookSaving}
                            style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 'var(--rs)', border: 'none', background: 'var(--ac)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            {webhookSaving ? '...' : (isRtl ? '⚡ הפעל אוטומציה' : '⚡ Enable Automation')}
                        </button>
                    )}
                </div>
            )}

            {/* Export */}
            <div className="fcard">
                <div className="fttl">{t.exportTitle}</div>
                <button
                    onClick={handleExport}
                    style={{
                        padding: '9px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: 'var(--rs)',
                        border: '1.5px solid var(--ib)',
                        background: 'var(--ibg)',
                        color: 'var(--ac)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    {t.exportJsonBtn}
                </button>
            </div>
            {editingMember && (
                <EditMemberModal
                    member={editingMember}
                    onSave={(name, nameEn) => onRenameMember(editingMember.id, name, nameEn)}
                    onClose={() => setEditingMember(null)}
                />
            )}
        </div>
    )
}
