// src/pages/LandingPage.tsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n/context'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import './LandingPage.css'

export default function LandingPage() {
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const { t } = useI18n()
    const lp = t.landing

    const handleCTA = async () => {
        if (user) {
            navigate('/app')
        } else {
            try {
                await login()
                navigate('/app')
            } catch (err) {
                console.error('Login failed', err)
            }
        }
    }

    return (
        <div className="lp-root">
            <div className="lp-mesh-1" />
            <div className="lp-mesh-2" />

            {/* Navbar */}
            <nav className="lp-nav">
                <div className="lp-logo">Home<span>Fine</span></div>
                <div className="lp-nav-right">
                    <LanguageToggle />
                    <button onClick={handleCTA} className="lp-nav-cta">
                        {user ? lp.navOpen : lp.navCta}
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="lp-hero">
                <div className="lp-hero-left">
                    <div className="lp-badge">
                        <span className="lp-badge-dot" />
                        {lp.badge}
                    </div>
                    <h1>
                        {lp.h1Line1}<br />
                        <span>{lp.h1Highlight}</span>
                    </h1>
                    <p>{lp.desc}</p>
                    <div className="lp-hero-actions">
                        <button onClick={handleCTA} className="lp-btn-primary">
                            {lp.ctaPrimary}
                        </button>
                        <a href="#features" className="lp-btn-ghost">
                            {lp.ctaGhost}
                        </a>
                    </div>
                </div>

                {/* Screenshot */}
                <div className="lp-hero-right">
                    <img
                        src={t.dir === 'rtl' ? '/screenshot-he.png' : '/screenshot-en.png'}
                        alt="HomeFine app screenshot"
                        className="lp-screenshot"
                    />
                </div>
            </section>

            {/* Stats */}
            <div className="lp-stats">
                {lp.stats.map((s) => (
                    <div key={s.num} className="lp-stat">
                        <span className="lp-stat-num">{s.num}</span>
                        <span className="lp-stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Features */}
            <section className="lp-section" id="features">
                <div className="lp-section-label">{lp.featuresLabel}</div>
                <h2 className="lp-section-title">
                    {lp.featuresTitle}<br />
                    <span>{lp.featuresTitleHighlight}</span>
                </h2>
                <div className="lp-features-grid">
                    {lp.features.map((f) => (
                        <div key={f.title} className="lp-feature">
                            <div className="lp-feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="lp-divider" />

            {/* Bottom CTA */}
            <section className="lp-cta-section">
                <h2>
                    {lp.ctaBottomTitle}<br />
                    <span>{lp.ctaBottomHighlight}</span>
                </h2>
                <p>{lp.ctaBottomDesc}</p>
                <button onClick={handleCTA} className="lp-btn-primary">
                    {lp.ctaBottomBtn}
                </button>
            </section>

            <footer className="lp-footer">
                {lp.footer} · {new Date().getFullYear()}
            </footer>
        </div>
    )
}
