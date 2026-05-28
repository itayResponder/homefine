// src/contexts/ui.tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import './ui.css'

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastItem { id: number; msg: string; type: 'success' | 'error' }

interface ToastCtxType {
    showToast: (msg: string, type?: 'success' | 'error') => void
}

const ToastCtx = createContext<ToastCtxType | null>(null)

export function useToast(): ToastCtxType {
    const ctx = useContext(ToastCtx)
    if (!ctx) throw new Error('useToast must be used inside <UIProvider>')
    return ctx
}

// ─── Confirm ──────────────────────────────────────────────────────────────────
export interface ConfirmOpts {
    title: string
    sub?: string
    okLabel?: string
    danger?: boolean
}

interface ConfirmCtxType {
    showConfirm: (opts: ConfirmOpts) => Promise<boolean>
}

const ConfirmCtx = createContext<ConfirmCtxType | null>(null)

export function useConfirm(): ConfirmCtxType {
    const ctx = useContext(ConfirmCtx)
    if (!ctx) throw new Error('useConfirm must be used inside <UIProvider>')
    return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function UIProvider({ children }: { children: ReactNode }) {
    const { t } = useI18n()

    // Toast
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now()
        setToasts((ts) => [...ts, { id, msg, type }])
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2800)
    }, [])

    // Confirm
    const [confirmState, setConfirmState] = useState<{
        opts: ConfirmOpts
        resolve: (v: boolean) => void
    } | null>(null)

    const showConfirm = useCallback(
        (opts: ConfirmOpts) =>
            new Promise<boolean>((resolve) => setConfirmState({ opts, resolve })),
        [],
    )

    const resolveConfirm = (value: boolean) => {
        confirmState?.resolve(value)
        setConfirmState(null)
    }

    return (
        <ToastCtx.Provider value={{ showToast }}>
            <ConfirmCtx.Provider value={{ showConfirm }}>
                {children}

                {/* Toast stack */}
                <div className="ui-toasts">
                    {toasts.map((toast) => (
                        <div key={toast.id} className={`ui-toast ui-toast--${toast.type}`}>
                            <span className="ui-toast-icon">
                                {toast.type === 'success' ? '✓' : '✕'}
                            </span>
                            {toast.msg}
                        </div>
                    ))}
                </div>

                {/* Confirm dialog */}
                {confirmState && (
                    <div
                        className="ui-confirm-overlay"
                        onClick={() => resolveConfirm(false)}
                    >
                        <div
                            className="ui-confirm-box"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="ui-confirm-icon">🗑️</div>
                            <div className="ui-confirm-title">
                                {confirmState.opts.title}
                            </div>
                            {confirmState.opts.sub && (
                                <div className="ui-confirm-sub">
                                    {confirmState.opts.sub}
                                </div>
                            )}
                            <div className="ui-confirm-btns">
                                <button
                                    className="ui-confirm-cancel"
                                    onClick={() => resolveConfirm(false)}
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    className={`ui-confirm-ok${confirmState.opts.danger ? ' danger' : ''}`}
                                    onClick={() => resolveConfirm(true)}
                                >
                                    {confirmState.opts.okLabel ?? t.deleteBtn}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </ConfirmCtx.Provider>
        </ToastCtx.Provider>
    )
}
