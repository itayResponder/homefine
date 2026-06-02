// src/pages/HouseholdPage.tsx
import { useHouseholdContext } from './HouseholdLayout'
import { HomeView } from '../components/home/HomeView'

export default function HouseholdPage() {
    const { householdId, members, user } = useHouseholdContext()
    const currentMemberId = members.find((m) => m.userId === user?.uid)?.id

    return (
        <div className="wrap">
            <HomeView
                householdId={householdId}
                members={members}
                currentMemberId={currentMemberId}
            />
        </div>
    )
}
