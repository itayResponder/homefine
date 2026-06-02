// src/pages/HouseholdPage.tsx
import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMembers } from '../hooks/useMembers'
import { useI18n } from '../i18n/context'
import { useConfirm } from '../contexts/ui'
import { useUserColor } from '../hooks/useUserColor'
import { useHouseholdMeta } from '../hooks/useHouseholdMeta'
import { useJoinRequests } from '../hooks/useJoinRequests'
import { AppHeader } from '../components/app/AppHeader'
import { HomeView } from '../components/home/HomeView'
import { usePresence } from '../hooks/usePresence'
import { approveJoinRequest, denyJoinRequest, subscribeUserMembership, leaveHousehold } from '../firebase/db'
import { buildColorVars } from '../utils/color'
import './AppPage.css'

export default function HouseholdPage() {
    const navigate = useNavigate()
    const { householdId = '' } = useParams<{ householdId: string }>()
    const { user, logout } = useAuth()
    const { t } = useI18n()
    const { showConfirm } = useConfirm()
    const { members, ready: membersReady } = useMembers(householdId)
    const { color: primaryColor, loading: colorLoading } = useUserColor(user?.uid)
    const { meta, isOwner } = useHouseholdMeta(householdId, user?.uid)
    const online = usePresence(householdId, user)

    const ownedEntry = isOwner && meta ? [{ id: householdId, name: meta.name }] : []
    const joinRequests = useJoinRequests(ownedEntry)

    // Auth guard — redirect if membership is lost
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

    const currentMemberId = members.find((m) => m.userId === user?.uid)?.id

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const handleApproveJoin = async (hId: string, uid: string) => {
        const request = joinRequests.find((r) => r.householdId === hId && r.uid === uid)
        await approveJoinRequest(hId, uid, request ? { name: request.name, email: request.email, photoURL: request.photoURL } : undefined)
    }

    const handleLeaveHousehold = async () => {
        if (!user) return
        const confirmed = await showConfirm({
            title: t.dir === 'rtl' ? 'עזיבת הבית' : 'Leave household',
            sub: t.dir === 'rtl' ? 'בטוח שאתה רוצה לעזוב? תאבד את הגישה לבית.' : 'Are you sure you want to leave? You will lose access.',
            danger: true,
        })
        if (!confirmed) return
        await leaveHousehold(householdId, user.uid)
        navigate('/dashboard')
    }

    if (colorLoading || !membersReady) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', opacity: 0.6 }}>
                    Home<span style={{ color: '#2563EB' }}>Fine</span>
                </span>
            </div>
        )
    }

    return (
        <div className="ap-root" style={buildColorVars(primaryColor) as React.CSSProperties}>
            <AppHeader
                user={user}
                householdId={householdId}
                onLogout={handleLogout}
                onDashboard={() => navigate('/dashboard')}
                joinRequests={isOwner ? joinRequests : []}
                onApproveJoin={isOwner ? handleApproveJoin : undefined}
                onDenyJoin={isOwner ? denyJoinRequest : undefined}
                onLeave={!isOwner ? handleLeaveHousehold : undefined}
                online={online}
            />
            <div className="wrap">
                <HomeView
                    householdId={householdId}
                    members={members}
                    currentMemberId={currentMemberId}
                />
            </div>
        </div>
    )
}
