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

    const {
        webhookConfig,
        webhookSaving,
        webhookTestStatus,
        webhookTestError,
        handleTestWebhook,
        handleGenerateKey,
        handleDeleteConfig,
        handleDownloadFlow,
    } = useWebhookAutomation({ householdId, currentUserId, memberId: myMember.id })

    return (
        <div className="fcard">
            <div className="fttl">⚡ {t.settings.automationTitle}</div>
            <div className={styles.automationDesc}>{t.settings.automationDesc}</div>

            {webhookConfig ? (
                <>
                    <div className={`${styles.connectionStatus} ${webhookConfig.lastPingedAt ? styles.connectionStatusConnected : styles.connectionStatusDisconnected}`}>
                        {webhookConfig.lastPingedAt
                            ? `🟢 ${t.settings.automationConnected} ${new Date(webhookConfig.lastPingedAt).toLocaleString(t.locale, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                            : `⚪ ${t.settings.automationNotConnected}`}
                    </div>

                    <button
                        onClick={handleDownloadFlow}
                        className={`${styles.automationBtn} ${styles.downloadBtn}`}
                    >
                        📥 {t.settings.automationDownloadBtn}
                    </button>

                    <button
                        onClick={handleTestWebhook}
                        disabled={webhookTestStatus === 'loading'}
                        className={`${styles.automationBtn} ${styles.testBtn} ${webhookTestStatus === 'loading' ? styles.testBtnLoading : ''}`}
                    >
                        {webhookTestStatus === 'loading' ? '⏳' : '🔌'} {t.settings.automationTestBtn}
                    </button>
                    {webhookTestStatus === 'ok' && (
                        <div className={styles.testSuccess}>
                            ✅ {t.settings.automationTestOk}
                        </div>
                    )}
                    {webhookTestStatus === 'error' && (
                        <div className={styles.testError}>
                            ❌ {webhookTestError}
                        </div>
                    )}

                    <div className={styles.disableRow}>
                        <button onClick={handleDeleteConfig} className={styles.disableBtn}>
                            {t.settings.automationDisableBtn}
                        </button>
                    </div>
                </>
            ) : (
                <button
                    onClick={handleGenerateKey}
                    disabled={webhookSaving}
                    className={styles.enableBtn}
                >
                    {webhookSaving ? '...' : t.settings.automationEnableBtn}
                </button>
            )}
        </div>
    )
}
