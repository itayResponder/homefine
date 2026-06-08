// src/components/app/SettingsView.tsx
import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/context'
import styles from './SettingsView.module.css'
import { EditMemberModal } from './EditMemberModal'
import { CategoryManager } from './CategoryManager'
import { saveWebhookConfig, deleteWebhookConfig, subscribeWebhookConfig, getAllWebhookConfigs, getHouseholdName } from '../../firebase/db'
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
                <div className={`fcard ${styles.ownerCard}`}>
                    <div className="fttl">👑 {isRtl ? 'הגדרות בעלים' : 'Owner Settings'}</div>

                    {/* Rename */}
                    <div className={styles.renameSection}>
                        <div className={styles.sectionLabel}>
                            {isRtl ? 'שם הבית' : 'Household name'}
                        </div>
                        {renaming ? (
                            <form onSubmit={handleRename} className={styles.renameForm}>
                                <input className={`inp ${styles.renameInput}`} value={newHouseName} onChange={e => setNewHouseName(e.target.value)} autoFocus required />
                                <button type="submit" className={`sbtn ${styles.renameSubmitBtn}`}>✓</button>
                                <button type="button" onClick={() => setRenaming(false)} className={styles.renameCancelBtn}>✕</button>
                            </form>
                        ) : (
                            <div className={styles.renameDisplay}>
                                <span className={styles.householdName}>{meta?.name}</span>
                                <button onClick={() => { setNewHouseName(meta?.name ?? ''); setRenaming(true) }} className={styles.renameBtn}>
                                    {isRtl ? 'שנה שם' : 'Rename'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Expenses-only toggle */}
                    <div className={styles.toggleRow}>
                        <div>
                            <div className={styles.toggleTitle}>
                                {isRtl ? 'מצב הוצאות בלבד' : 'Expenses-only mode'}
                            </div>
                            <div className={styles.toggleSubtitle}>
                                {isRtl ? 'מסתיר את לשונית ההכנסות מכל חברי הבית' : 'Hides the income tab for all members'}
                            </div>
                        </div>
                        <button
                            onClick={() => onUpdateSettings({ expensesOnly: !meta?.settings?.expensesOnly })}
                            className={`${styles.toggle} ${meta?.settings?.expensesOnly ? styles.toggleOn : ''}`}
                        >
                            <span className={`${styles.toggleKnob} ${meta?.settings?.expensesOnly ? styles.toggleKnobOn : ''}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Household participants ─────────────────────────── */}
            {isOwner && participants && participants.length > 0 && (
                <div className="fcard">
                    <div className="fttl">🔑 {isRtl ? 'גישה לבית' : 'Household Access'}</div>
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
                                            {isRtl ? 'בעלים' : 'Owner'}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.participantEmail}>{p.email}</div>
                                <div className={styles.participantJoinDate}>{isRtl ? 'הצטרף' : 'Joined'} {fmtJoinDate(p.joinedAt)}</div>
                            </div>
                            {p.uid !== currentUserId && onRemoveParticipant && (
                                <button
                                    onClick={() => onRemoveParticipant(p.uid)}
                                    className={styles.removeParticipantBtn}
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
                    <div className={styles.toggleRow}>
                        <div>
                            <div className={styles.toggleTitle}>
                                {isRtl ? 'הסתר את ההכנסות שלי' : 'Hide my income'}
                            </div>
                            <div className={styles.toggleSubtitle}>
                                {isRtl ? 'רק אני אראה את ההכנסות שלי' : 'Only I can see my income'}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleMemberIncome(myMember)}
                            className={`${styles.toggle} ${myMember.privateIncome ? styles.toggleOn : ''}`}
                        >
                            <span className={`${styles.toggleKnob} ${myMember.privateIncome ? styles.toggleKnobOn : ''}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* Member management */}
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
                                        title={isRtl ? 'שנה שם' : 'Edit name'}
                                        className={styles.memberEditBtn}
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
                        <div className={styles.colorHint}>
                            {t.dir === 'rtl' ? 'לחץ לשינוי הצבע' : 'Click to change color'}
                        </div>
                    </div>
                    {primaryColor !== DEFAULT_COLOR && (
                        <button
                            onClick={() => onColorChange(DEFAULT_COLOR)}
                            className={styles.colorResetBtn}
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
                    <div className={styles.automationDesc}>
                        {isRtl
                            ? 'חבר את MacroDroid כדי שכל רכישה ב-Google Wallet תיכנס אוטומטית לאפליקציה.'
                            : 'Connect MacroDroid so every Google Wallet purchase is added automatically.'}
                    </div>

                    {webhookConfig ? (
                        <>
                            {/* Connection status */}
                            <div className={`${styles.connectionStatus} ${webhookConfig.lastPingedAt ? styles.connectionStatusConnected : styles.connectionStatusDisconnected}`}>
                                {webhookConfig.lastPingedAt
                                    ? `🟢 ${isRtl ? 'מחובר — פעיל לאחרונה' : 'Connected — last active'} ${new Date(webhookConfig.lastPingedAt).toLocaleString(isRtl ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                                    : `⚪ ${isRtl ? 'טרם חובר — הורד את קובץ ההגדרה וייבא ל-MacroDroid' : 'Not connected yet — download config and import to MacroDroid'}`}
                            </div>

                            {/* MacroDroid download */}
                            <button
                                onClick={handleDownloadMacro}
                                className={`${styles.automationBtn} ${styles.downloadBtn}`}
                            >
                                📥 {isRtl ? 'הורד קובץ הגדרה ל-MacroDroid' : 'Download MacroDroid Config'}
                            </button>
                            <div className={styles.automationInstructions}>
                                {isRtl
                                    ? 'פתח MacroDroid ← Export/Import ← Import ← בחר את הקובץ שהורדת. הכל מוגדר אוטומטית.'
                                    : 'Open MacroDroid → Export/Import → Import → select the downloaded file. Everything is pre-configured.'}
                            </div>

                            {/* Test connection */}
                            <button
                                onClick={handleTestWebhook}
                                disabled={webhookTestStatus === 'loading'}
                                className={`${styles.automationBtn} ${styles.testBtn} ${webhookTestStatus === 'loading' ? styles.testBtnLoading : ''}`}
                            >
                                {webhookTestStatus === 'loading' ? '⏳' : '🔌'} {isRtl ? 'בדוק חיבור' : 'Test Connection'}
                            </button>
                            {webhookTestStatus === 'ok' && (
                                <div className={styles.testSuccess}>
                                    ✅ {isRtl ? 'עסקת בדיקה נוצרה! תוכל למחוק אותה מרשימת ההוצאות.' : 'Test transaction created! You can delete it from expenses.'}
                                </div>
                            )}
                            {webhookTestStatus === 'error' && (
                                <div className={styles.testError}>
                                    ❌ {webhookTestError}
                                </div>
                            )}

                            {/* Disable automation */}
                            <div className={styles.disableRow}>
                                <button onClick={handleDeleteConfig} className={styles.disableBtn}>
                                    {isRtl ? 'כבה אוטומציה' : 'Disable automation'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={handleGenerateKey}
                            disabled={webhookSaving}
                            className={styles.enableBtn}
                        >
                            {webhookSaving ? '...' : (isRtl ? '⚡ הפעל אוטומציה' : '⚡ Enable Automation')}
                        </button>
                    )}
                </div>
            )}

            {/* Export */}
            <div className="fcard">
                <div className="fttl">{t.exportTitle}</div>
                <button onClick={handleExport} className={styles.exportBtn}>
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
