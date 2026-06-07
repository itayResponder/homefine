// src/components/app/SettingsView.tsx
import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/context'
import { EditMemberModal } from './EditMemberModal'
import { CategoryManager } from './CategoryManager'
import { saveWebhookConfig, deleteWebhookConfig, subscribeWebhookConfig, getAllWebhookConfigs, getHouseholdName } from '../../firebase/db'
import { WebhookLogModal } from './WebhookLogModal'
import type { Category, HouseholdMeta, HouseholdSettings, LogEntry, Member, Participant, RecurringCharge, Transaction, WebhookConfig } from '../../types'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? ''

function generateMacroDroidFile(configs: Array<{ apiKey: string; householdName: string }>, webhookUrl: string): string {
    const id = () => -(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1)
    const now = Date.now()
    const makeHttpAction = (apiKey: string) => ({
        disableLogging: false,
        m_classType: 'HttpRequestAction',
        m_constraintList: [],
        m_isDisabled: false,
        m_isOrCondition: false,
        m_SIGUID: id(),
        requestConfig: {
            allFilesAccessPath: '',
            allowAnyCertificate: false,
            basicAuthEnabled: false,
            basicAuthPassword: '',
            basicAuthUsername: '',
            blockNextAction: false,
            clientCertEnabled: false,
            clientCertKeyStoreDisplayName: '',
            clientCertKeyStoreUri: '',
            clientCertPassword: '',
            contentBodyDynamicFileName: '',
            contentBodyFileDisplayName: '',
            contentBodyFileUri: '',
            contentBodyFolderDisplayName: '',
            contentBodyFolderUri: '',
            contentBodySource: 0,
            contentBodyText: `{"title":"{not_title}","body":"{notification}","apiKey":"${apiKey}"}`,
            contentType: 'application/json',
            followRedirects: true,
            headerParams: [],
            localFileUri: '',
            prettifyJson: false,
            queryParams: [],
            requestTimeOutSeconds: 30,
            requestType: 1,
            saveResponseAllFilesAccessPath: '',
            saveResponseFileName: '',
            saveResponseFolderPathDisplayName: '',
            saveResponseFolderPathUri: '',
            saveResponseType: 0,
            saveResponseUseAllFilesAccess: false,
            saveReturnCodeToVariable: false,
            saveReturnHeadersToVariable: false,
            urlToOpen: webhookUrl,
            useAllFilesAccess: false,
            useLocalFileUri: false,
            useStaticContentBodyFile: true,
        },
    })
    const names = configs.map(c => c.householdName).join(', ')
    return JSON.stringify({
        exportFormat: 2,
        exportAppVersion: 596300015,
        timestamp: now,
        variables: [],
        cellTowerGroups: [],
        stopWatches: [],
        userIcons: [],
        customDrawerConfigs: [],
        macroList: [{
            aiGenerated: 0,
            breakpoints: [],
            disabledTimestamp: 0,
            exportedActionBlocks: [],
            forceEvenIfNotEnabledTimestamp: 0,
            isActionBlock: false,
            isExtra: false,
            isFavourite: false,
            lastEditedTimestamp: now,
            localVariables: [],
            localVarsAlphabetical: true,
            m_GUID: id(),
            m_category: 'Uncategorized',
            m_constraintList: [],
            m_description: '',
            m_descriptionOpen: false,
            m_enabled: true,
            m_excludeLog: false,
            m_headingColor: 0,
            m_isOrCondition: false,
            m_name: `Google Wallet → HomeFine (${names})`,
            m_triggerList: [{
                disableLogging: false,
                enableRegex: false,
                ignoreCase: true,
                m_applicationNameList: ['Google Wallet'],
                m_classType: 'NotificationTrigger',
                m_constraintList: [],
                m_exactMatch: false,
                m_excludeApps: false,
                m_excludes: false,
                m_ignoreOngoing: false,
                m_isDisabled: false,
                m_isOrCondition: false,
                m_option: 0,
                m_packageNameList: ['com.google.android.apps.walletnfcrel'],
                m_SIGUID: id(),
                m_soundOption: 0,
                m_supressMultiples: true,
                m_textContent: '',
                matchOptionMessage: 0,
                matchOptionTitle: 0,
                separateTitleAndMessage: false,
            }],
            m_actionList: configs.map(c => makeHttpAction(c.apiKey)),
        }],
    })
}

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
    // Categories
    categories: Category[]
    onAddCategory: (cat: Omit<Category, 'id'>) => Promise<string>
    onUpdateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDeleteCategory: (id: string) => Promise<void>
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
    categories, onAddCategory, onUpdateCategory, onDeleteCategory,
}: Props) {
    const { t } = useI18n()

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
    const [webhookSaving, setWebhookSaving] = useState(false)
    const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
    const [webhookTestError, setWebhookTestError] = useState('')
    const [showWebhookLog, setShowWebhookLog] = useState(false)

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

    const handleDownloadMacro = async () => {
        if (!webhookConfig || !currentUserId) return
        const allConfigs = await getAllWebhookConfigs(currentUserId)
        const entries = await Promise.all(
            Object.entries(allConfigs).map(async ([hId, cfg]) => ({
                apiKey: cfg.apiKey,
                householdName: await getHouseholdName(hId),
            }))
        )
        const json = generateMacroDroidFile(entries, WEBHOOK_URL)
        const blob = new Blob([json], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'HomeFine_Wallet.mdr'
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleTestWebhook = async () => {
        if (!webhookConfig || !WEBHOOK_URL) return
        setWebhookTestStatus('loading')
        setWebhookTestError('')
        try {
            const today = new Date()
            const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${String(today.getFullYear()).slice(2)}`
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: webhookConfig.apiKey, title: `TEST  ${dateStr}`, body: '₪1.00 with Test Card ••0000', isTest: true }),
            })
            const data = await res.json() as { ok: boolean; error?: string }
            if (data.ok) {
                setWebhookTestStatus('ok')
            } else {
                setWebhookTestStatus('error')
                setWebhookTestError(data.error === 'Invalid API key' ? (isRtl ? 'מפתח לא תקין — צור מפתח חדש' : 'Invalid API key — regenerate') : (data.error ?? (isRtl ? 'שגיאה לא ידועה' : 'Unknown error')))
            }
        } catch {
            setWebhookTestStatus('error')
            setWebhookTestError(isRtl ? 'השרת לא זמין — נסה שוב' : 'Server unavailable — try again')
        }
    }

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
        setWebhookSaving(false)
    }

    const handleDeleteConfig = async () => {
        if (!currentUserId || !webhookConfig) return
        await deleteWebhookConfig(currentUserId, householdId, webhookConfig.apiKey)
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
                <CategoryManager
                    categories={categories}
                    onAdd={onAddCategory}
                    onUpdate={onUpdateCategory}
                    onDelete={onDeleteCategory}
                />
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
                            {/* Connection status */}
                            <div style={{ fontSize: 11, padding: '7px 10px', borderRadius: 6, background: webhookConfig.lastPingedAt ? '#F0FDF4' : '#F8FAFC', color: webhookConfig.lastPingedAt ? '#16A34A' : '#94A3B8' }}>
                                {webhookConfig.lastPingedAt
                                    ? `🟢 ${isRtl ? 'מחובר — פעיל לאחרונה' : 'Connected — last active'} ${new Date(webhookConfig.lastPingedAt).toLocaleString(isRtl ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                                    : `⚪ ${isRtl ? 'טרם חובר — הורד את קובץ ההגדרה וייבא ל-MacroDroid' : 'Not connected yet — download config and import to MacroDroid'}`}
                            </div>

                            {/* MacroDroid download */}
                            <button
                                onClick={handleDownloadMacro}
                                style={{ width: '100%', padding: '9px 12px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--acl)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left' }}
                            >
                                📥 {isRtl ? 'הורד קובץ הגדרה ל-MacroDroid' : 'Download MacroDroid Config'}
                            </button>
                            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
                                {isRtl
                                    ? 'פתח MacroDroid ← Export/Import ← Import ← בחר את הקובץ שהורדת. הכל מוגדר אוטומטית.'
                                    : 'Open MacroDroid → Export/Import → Import → select the downloaded file. Everything is pre-configured.'}
                            </div>

                            {/* Test connection */}
                            <button
                                onClick={handleTestWebhook}
                                disabled={webhookTestStatus === 'loading'}
                                style={{ width: '100%', padding: '9px 12px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--ibg)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left', opacity: webhookTestStatus === 'loading' ? 0.6 : 1 }}
                            >
                                {webhookTestStatus === 'loading' ? '⏳' : '🔌'} {isRtl ? 'בדוק חיבור' : 'Test Connection'}
                            </button>
                            {webhookTestStatus === 'ok' && (
                                <div style={{ fontSize: 11, color: '#16A34A', background: '#F0FDF4', borderRadius: 6, padding: '7px 10px' }}>
                                    ✅ {isRtl ? 'עסקת בדיקה נוצרה! תוכל למחוק אותה מרשימת ההוצאות.' : 'Test transaction created! You can delete it from expenses.'}
                                </div>
                            )}
                            {webhookTestStatus === 'error' && (
                                <div style={{ fontSize: 11, color: '#E11D48', background: '#FFF1F2', borderRadius: 6, padding: '7px 10px' }}>
                                    ❌ {webhookTestError}
                                </div>
                            )}

                            {/* Webhook log */}
                            <button
                                onClick={() => setShowWebhookLog(true)}
                                style={{ width: '100%', padding: '9px 12px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--rs)', border: '1.5px solid var(--ib)', background: 'var(--ibg)', color: 'var(--ac)', cursor: 'pointer', fontFamily: 'inherit', textAlign: isRtl ? 'right' : 'left' }}
                            >
                                📋 {isRtl ? 'לוג רכישות' : 'Purchase Log'}
                            </button>

                            {/* Disable automation */}
                            <div style={{ textAlign: 'center', marginTop: 4 }}>
                                <button
                                    onClick={handleDeleteConfig}
                                    style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                                >
                                    {isRtl ? 'כבה אוטומציה' : 'Disable automation'}
                                </button>
                            </div>
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
            {showWebhookLog && (
                <WebhookLogModal
                    householdId={householdId}
                    isRtl={isRtl}
                    onClose={() => setShowWebhookLog(false)}
                />
            )}
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
