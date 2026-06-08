import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/context'
import {
    saveWebhookConfig,
    deleteWebhookConfig,
    subscribeWebhookConfig,
    getAllWebhookConfigs,
    getHouseholdName,
} from '../firebase/db'
import { generateMacroDroidFile } from '../utils/macroDroid'
import type { WebhookConfig } from '../types'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL ?? ''

type TestStatus = 'idle' | 'loading' | 'ok' | 'error'

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
    handleDownloadMacro: () => Promise<void>
    handleTestWebhook: () => Promise<void>
    handleGenerateKey: () => Promise<void>
    handleDeleteConfig: () => Promise<void>
}

export function useWebhookAutomation({ householdId, currentUserId, memberId }: Options): UseWebhookAutomationResult {
    const { t } = useI18n()

    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
    const [webhookSaving, setWebhookSaving] = useState(false)
    const [webhookTestStatus, setWebhookTestStatus] = useState<TestStatus>('idle')
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

    return {
        webhookConfig,
        webhookSaving,
        webhookTestStatus,
        webhookTestError,
        handleDownloadMacro,
        handleTestWebhook,
        handleGenerateKey,
        handleDeleteConfig,
    }
}
