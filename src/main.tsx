import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nProvider } from './i18n/context'
import { UIProvider } from './contexts/ui'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <I18nProvider>
            <UIProvider>
                <App />
            </UIProvider>
        </I18nProvider>
    </StrictMode>,
)
