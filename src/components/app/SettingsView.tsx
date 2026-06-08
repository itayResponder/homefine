// src/components/app/SettingsView.tsx
import { useI18n } from '../../i18n/context'
import { useHouseholdContext } from '../../pages/HouseholdLayout'
import { CategoryManager } from './settings/CategoryManager'
import { AutomationSection } from './settings/AutomationSection'
import { ColorThemeSection } from './settings/ColorThemeSection'
import { ExportSection } from './settings/ExportSection'
import { IncomePrivacySection } from './settings/IncomePrivacySection'
import { MembersSection } from './settings/MembersSection'
import { OwnerSettingsSection } from './settings/OwnerSettingsSection'
import { ParticipantsSection } from './settings/ParticipantsSection'
import type { LogEntry, Participant, RecurringCharge, Transaction } from '../../types'

interface SettingsViewProps {
    transactions: Transaction[]
    recurringCharges: RecurringCharge[]
    logs: LogEntry[]
    onRemoveMember: (id: string) => void
    participants?: Participant[]
    onRemoveParticipant?: (uid: string) => void
    onRenameMember: (id: string, name: string, nameEn?: string) => void
}

export function SettingsView({
    transactions, recurringCharges, logs,
    onRemoveMember, participants, onRemoveParticipant, onRenameMember,
}: SettingsViewProps) {
    const { t } = useI18n()
    const {
        householdId, user, members, isOwner, meta,
        primaryColor, updateColor,
        updateSettings, renameMeta, toggleMemberIncome,
        categories, addCategory, updateCategory, deleteCategory,
    } = useHouseholdContext()
    const currentUserId = user?.uid
    const myMember = members.find(m => m.userId === currentUserId)

    return (
        <div>
            {/* ── Owner controls ─────────────────────────────────── */}
            {isOwner && (
                <OwnerSettingsSection
                    meta={meta}
                    onUpdateSettings={updateSettings}
                    onRename={renameMeta}
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
                <IncomePrivacySection myMember={myMember} onToggleMemberIncome={toggleMemberIncome} />
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
                    onAdd={addCategory}
                    onUpdate={updateCategory}
                    onDelete={deleteCategory}
                />
            </div>

            <ColorThemeSection primaryColor={primaryColor} onColorChange={updateColor} />

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
