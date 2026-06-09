// src/pages/HouseholdLayout.tsx
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate, useParams, useLocation, Outlet, useOutletContext } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { usePresence } from '../hooks/usePresence'
import { useUserColor } from '../hooks/useUserColor'
import { useHouseholdMeta } from '../hooks/useHouseholdMeta'
import { useJoinRequests } from '../hooks/useJoinRequests'
import { useCategories } from '../hooks/useCategories'
import { useI18n } from '../i18n/context'
import { useConfirm } from '../contexts/ui'
import { AppHeader } from '../components/app/AppHeader'
import { WebhookLogModal } from '../components/app/settings/WebhookLogModal'
import {
    approveJoinRequest,
    denyJoinRequest,
    subscribeUserMembership,
    leaveHousehold,
    seedParticipant,
} from '../firebase/db'
import { buildColorVars } from '../utils/color'
import type { AppUser, Category, Member, HouseholdMeta, HouseholdSettings, JoinRequest } from '../types'
import type { PresenceMap } from '../hooks/usePresence'
import './AppPage.css'

export interface HouseholdContextType {
    householdId: string
    user: AppUser | null
    members: Member[]
    membersReady: boolean
    online: PresenceMap
    isOwner: boolean
    expensesOnly: boolean
    meta: HouseholdMeta | null
    primaryColor: string
    updateColor: (color: string) => void
    joinRequests: JoinRequest[]
    openModal: 'settings' | 'logs' | null
    setOpenModal: (m: 'settings' | 'logs' | null) => void
    updateSettings: (settings: Partial<HouseholdSettings>) => void
    renameMeta: (name: string) => void
    toggleMemberIncome: (member: Member) => void
    addMember: (name: string, nameEn?: string, userId?: string) => void
    removeMember: (id: string) => void
    categories: Category[]
    categoriesReady: boolean
    addCategory: (cat: Omit<Category, 'id'>) => Promise<string>
    updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    deleteCategory: (id: string) => Promise<void>
}

export const useHouseholdContext = () => useOutletContext<HouseholdContextType>()

export default function HouseholdLayout() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { householdId = '' } = useParams<{ householdId: string }>()
    const { user, logout } = useAuth()
    const { members, ready: membersReady, add: addMember, remove: removeMember } = useMembers(householdId)
    const { categories, categoriesReady, addCategory, updateCategory, deleteCategory } = useCategories(householdId)
    const online = usePresence(householdId, user)
    const { color: primaryColor, updateColor } = useUserColor(user?.uid)
    const { meta, isOwner, expensesOnly, updateSettings, renameMeta, toggleMemberIncome } = useHouseholdMeta(householdId, user?.uid)
    const { t } = useI18n()
    const { showConfirm } = useConfirm()
    const [openModal, setOpenModal] = useState<'settings' | 'logs' | null>(null)
    const [showWebhookLog, setShowWebhookLog] = useState(false)

    const ownedEntry = isOwner && meta ? [{ id: householdId, name: meta.name }] : []
    const joinRequests = useJoinRequests(ownedEntry)

    // Auth guard — redirect if membership is revoked
    const membershipInitRef = useRef(false)
    useEffect(() => {
        if (!user) return
        membershipInitRef.current = false
        return subscribeUserMembership(householdId, user.uid, (isMember) => {
            if (!membershipInitRef.current) {
                membershipInitRef.current = true
                if (!isMember) navigate('/dashboard', { replace: true })
            } else if (!isMember) {
                navigate('/dashboard', { replace: true })
            }
        })
    }, [user?.uid, householdId])

    // Seed participant entry on first load
    useEffect(() => {
        if (!user || !meta) return
        seedParticipant(householdId, user.uid, {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            joinedAt: meta.createdAt,
        }).catch(() => {})
    }, [!!meta, user?.uid])

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const handleLeaveHousehold = async () => {
        if (!user) return
        const confirmed = await showConfirm({
            title: t.leaveHouseholdTitle,
            sub: t.leaveHouseholdSub,
            danger: true,
        })
        if (!confirmed) return
        await leaveHousehold(householdId, user.uid)
        navigate('/dashboard')
    }

    const handleApproveJoin = async (hId: string, uid: string) => {
        const request = joinRequests.find((r) => r.householdId === hId && r.uid === uid)
        await approveJoinRequest(
            hId,
            uid,
            request ? { name: request.name, email: request.email, photoURL: request.photoURL } : undefined,
            request?.nameHe ? { nameHe: request.nameHe, nameEn: request.nameEn } : undefined,
        )
    }

    const isFinanceTab = !pathname.endsWith('/home') && !pathname.endsWith('/calendar')

    const ctx: HouseholdContextType = {
        householdId,
        user,
        members,
        membersReady,
        online,
        isOwner,
        expensesOnly,
        meta,
        primaryColor,
        updateColor,
        joinRequests,
        openModal,
        setOpenModal,
        updateSettings,
        renameMeta,
        toggleMemberIncome,
        addMember,
        removeMember,
        categories,
        categoriesReady,
        addCategory,
        updateCategory,
        deleteCategory,
    }

    return (
        <div className="ap-root" style={buildColorVars(primaryColor) as CSSProperties}>
            <AppHeader
                user={user}
                householdId={householdId}
                onLogout={handleLogout}
                onOpenSettings={isFinanceTab ? () => setOpenModal('settings') : undefined}
                onOpenLogs={isFinanceTab ? () => setOpenModal('logs') : undefined}
                onOpenWebhookLog={() => setShowWebhookLog(true)}
                onDashboard={() => navigate('/dashboard')}
                joinRequests={isOwner ? joinRequests : []}
                onApproveJoin={isOwner ? handleApproveJoin : undefined}
                onDenyJoin={isOwner ? denyJoinRequest : undefined}
                onLeave={!isOwner ? handleLeaveHousehold : undefined}
                online={online}
            />
            <Outlet context={ctx} />
            {showWebhookLog && (
                <WebhookLogModal
                    householdId={householdId}
                    onClose={() => setShowWebhookLog(false)}
                />
            )}
        </div>
    )
}
