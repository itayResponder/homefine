import { useI18n } from '../../../i18n/context'
import { useWebhookAutomation } from '../../../hooks/useWebhookAutomation'
import type { Member } from '../../../types'
import styles from '../SettingsView.module.css'

interface Props {
    householdId: string
    currentUserId: string
    myMember: Member
}

export function AutomationSection({ householdId, currentUserId, myMember }: Props) {
    const { t } = useI18n()
    const isRtl = t.dir === 'rtl'

    const {
        webhookConfig,
        webhookSaving,
        webhookTestStatus,
        webhookTestError,
        handleDownloadMacro,
        handleTestWebhook,
        handleGenerateKey,
        handleDeleteConfig,
    } = useWebhookAutomation({ householdId, currentUserId, memberId: myMember.id })

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
