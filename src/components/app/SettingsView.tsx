// src/components/app/SettingsView.tsx
import { useI18n } from '../../i18n/context'
import { CategoryManager } from './CategoryManager'
import { AutomationSection } from './settings/AutomationSection'
import { ColorThemeSection } from './settings/ColorThemeSection'
import { ExportSection } from './settings/ExportSection'
import { IncomePrivacySection } from './settings/IncomePrivacySection'
import { MembersSection } from './settings/MembersSection'
import { OwnerSettingsSection } from './settings/OwnerSettingsSection'
import { ParticipantsSection } from './settings/ParticipantsSection'
import type { Category, HouseholdMeta, HouseholdSettings, LogEntry, Member, Participant, RecurringCharge, Transaction } from '../../types'

interface Props {
    householdId: string
    transactions: Transaction[]
    recurringCharges: RecurringCharge[]
    members: Member[]
    logs: LogEntry[]
    onRemoveMember: (id: string) => void
    primaryColor: string
    onColorChange: (color: string) => void
    // Owner controls
    isOwner: boolean
    meta: HouseholdMeta | null
    onUpdateSettings: (s: Partial<HouseholdSettings>) => void
    onRename: (name: string) => void
    // Income privacy
    currentUserId?: string
    onToggleMemberIncome: (member: Member) => void
    // Participants (owner only)
    participants?: Participant[]
    onRemoveParticipant?: (uid: string) => void
    onRenameMember: (id: string, name: string, nameEn?: string) => void
    // Categories
    categories: Category[]
    onAddCategory: (cat: Omit<Category, 'id'>) => Promise<string>
    onUpdateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>
    onDeleteCategory: (id: string) => Promise<void>
}

export function SettingsView({
    householdId,
    transactions, recurringCharges, members, logs,
    onRemoveMember, primaryColor, onColorChange,
    isOwner, meta, onUpdateSettings, onRename,
    currentUserId, onToggleMemberIncome,
    participants, onRemoveParticipant,
    onRenameMember,
    categories, onAddCategory, onUpdateCategory, onDeleteCategory,
}: Props) {
    const { t } = useI18n()
    const myMember = members.find(m => m.userId === currentUserId)

    return (
        <div>
            {/* ── Owner controls ─────────────────────────────────── */}
            {isOwner && (
                <OwnerSettingsSection
                    meta={meta}
                    onUpdateSettings={onUpdateSettings}
                    onRename={onRename}
                />
            )}

            {/* ── Household participants ─────────────────────────── */}
            {isOwner && participants && participants.length > 0 && (
                <ParticipantsSection
                    participants={participants}
                    currentUserId={currentUserId}
                    onRemoveParticipant={onRemoveParticipant}
                />
            )}

            {/* ── My income privacy ─────────────────────────────── */}
            {myMember && (
                <IncomePrivacySection myMember={myMember} onToggleMemberIncome={onToggleMemberIncome} />
            )}

            <MembersSection
                members={members}
                currentUserId={currentUserId}
                onRemoveMember={onRemoveMember}
                onRenameMember={onRenameMember}
            />

            {/* Categories */}
            <div className="fcard">
                <div className="fttl">{t.categoriesLabel}</div>
                <CategoryManager
                    categories={categories}
                    onAdd={onAddCategory}
                    onUpdate={onUpdateCategory}
                    onDelete={onDeleteCategory}
                />
            </div>

            <ColorThemeSection primaryColor={primaryColor} onColorChange={onColorChange} />

            {currentUserId && myMember && (
                <AutomationSection
                    householdId={householdId}
                    currentUserId={currentUserId}
                    myMember={myMember}
                />
            )}

            <ExportSection
                transactions={transactions}
                recurringCharges={recurringCharges}
                members={members}
                logs={logs}
            />
        </div>
    )
}
