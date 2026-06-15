import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/context'
import {
    saveWebhookConfig,
    deleteWebhookConfig,
    subscribeWebhookConfig,
} from '../firebase/db'
import type { WebhookConfig } from '../types'
import { generateAutomateFlowBinary } from '../utils/automateFlow'
import { useAllWebhookConfigs } from './useAllWebhookConfigs'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? ''

type TestStatus = 'idle' | 'loading' | 'ok' | 'error'
type CopyStatus = 'idle' | 'copied'

interface Options {
    householdId: string
    currentUserId: string
    memberId: string
}

interface UseWebhookAutomationResult {
    webhookConfig: WebhookConfig | null
    webhookSaving: boolean
    webhookTestStatus: TestStatus
    webhookTestError: string
    copyStatus: CopyStatus
    copyUrlStatus: CopyStatus
    handleCopyBody: () => Promise<void>
    handleCopyUrl: () => Promise<void>
    handleTestWebhook: () => Promise<void>
    handleGenerateKey: () => Promise<void>
    handleDeleteConfig: () => Promise<void>
    handleDownloadFlow: () => void
}

export function useWebhookAutomation({ householdId, currentUserId, memberId }: Options): UseWebhookAutomationResult {
    const { t } = useI18n()

    const allConfigs = useAllWebhookConfigs(currentUserId)
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
    const [webhookSaving, setWebhookSaving] = useState(false)
    const [webhookTestStatus, setWebhookTestStatus] = useState<TestStatus>('idle')
    const [webhookTestError, setWebhookTestError] = useState('')
    const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
    const [copyUrlStatus, setCopyUrlStatus] = useState<CopyStatus>('idle')

    useEffect(() => {
        return subscribeWebhookConfig(currentUserId, householdId, setWebhookConfig)
    }, [currentUserId, householdId])

    const handleCopyBody = async () => {
        if (!webhookConfig) return
        const body = JSON.stringify({
            title: '{notifTitle}',
            body: '{notifText}',
            apiKey: webhookConfig.apiKey,
            ticker: '{notifTicker}',
            timestamp: '{notifTimestamp}',
            extras: '{notifExtras}',
        })
        await navigator.clipboard.writeText(body)
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 2000)
    }

    const handleCopyUrl = async () => {
        await navigator.clipboard.writeText(WEBHOOK_URL)
        setCopyUrlStatus('copied')
        setTimeout(() => setCopyUrlStatus('idle'), 2000)
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
                setWebhookTestError(
                    data.error === 'Invalid API key'
                        ? t.settings.automationInvalidKey
                        : (data.error ?? t.settings.automationUnknownError)
                )
            }
        } catch {
            setWebhookTestStatus('error')
            setWebhookTestError(t.settings.automationServerError)
        }
    }

    const handleGenerateKey = async () => {
        setWebhookSaving(true)
        const apiKey = crypto.randomUUID()
        await saveWebhookConfig(
            currentUserId,
            householdId,
            { apiKey, householdId, memberId },
            webhookConfig?.apiKey,
        )
        setWebhookSaving(false)
    }

    const handleDeleteConfig = async () => {
        if (!webhookConfig) return
        await deleteWebhookConfig(currentUserId, householdId, webhookConfig.apiKey)
    }

    const handleDownloadFlow = () => {
        if (allConfigs.length === 0) return
        const binary = generateAutomateFlowBinary(allConfigs, WEBHOOK_URL)
        const blob = new Blob([binary], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'HomeFine_Wallet.flo'
        a.click()
        URL.revokeObjectURL(url)
    }

    return {
        webhookConfig,
        webhookSaving,
        webhookTestStatus,
        webhookTestError,
        copyStatus,
        copyUrlStatus,
        handleCopyBody,
        handleCopyUrl,
        handleTestWebhook,
        handleGenerateKey,
        handleDeleteConfig,
        handleDownloadFlow,
    }
}
