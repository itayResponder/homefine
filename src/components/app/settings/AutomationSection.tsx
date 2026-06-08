import { useEffect, useState } from 'react'
import { useI18n } from '../../../i18n/context'
import { saveWebhookConfig, deleteWebhookConfig, subscribeWebhookConfig, getAllWebhookConfigs, getHouseholdName } from '../../../firebase/db'
import type { Member, WebhookConfig } from '../../../types'
import styles from '../SettingsView.module.css'

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
    currentUserId: string
    myMember: Member
}

export function AutomationSection({ householdId, currentUserId, myMember }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
    const [webhookSaving, setWebhookSaving] = useState(false)
    const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
    const [webhookTestError, setWebhookTestError] = useState('')

    useEffect(() => {
        return subscribeWebhookConfig(currentUserId, householdId, setWebhookConfig)
    }, [currentUserId, householdId])

    const handleDownloadMacro = async () => {
        if (!webhookConfig) return
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
        if (!webhookConfig) return
        await deleteWebhookConfig(currentUserId, householdId, webhookConfig.apiKey)
    }

    return (
        <div className="fcard">
            <div className="fttl">⚡ {isRtl ? 'אוטומציה — Google Wallet' : 'Automation — Google Wallet'}</div>
            <div className={styles.automationDesc}>
                {isRtl
                    ? 'חבר את MacroDroid כדי שכל רכישה ב-Google Wallet תיכנס אוטומטית לאפליקציה.'
                    : 'Connect MacroDroid so every Google Wallet purchase is added automatically.'}
            </div>

            {webhookConfig ? (
                <>
                    <div className={`${styles.connectionStatus} ${webhookConfig.lastPingedAt ? styles.connectionStatusConnected : styles.connectionStatusDisconnected}`}>
                        {webhookConfig.lastPingedAt
                            ? `🟢 ${isRtl ? 'מחובר — פעיל לאחרונה' : 'Connected — last active'} ${new Date(webhookConfig.lastPingedAt).toLocaleString(isRtl ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                            : `⚪ ${isRtl ? 'טרם חובר — הורד את קובץ ההגדרה וייבא ל-MacroDroid' : 'Not connected yet — download config and import to MacroDroid'}`}
                    </div>

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
    )
}
