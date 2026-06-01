// src/components/home/tasks/TaskRoomGroup.tsx
import { useI18n } from '../../../i18n/context'
import { TaskCard } from './TaskCard'
import { getTaskUrgency } from '../../../utils/taskUrgency'
import { ROOM_DEFS } from '../../../constants/rooms'
import type { Task, TaskRoom } from '../../../types/home'
import type { Member } from '../../../types'

const URGENCY_ORDER = { overdue: 0, due: 1, medium: 2, fresh: 3 }

const ROOM_I18N_KEY: Record<TaskRoom, 'roomBathroom' | 'roomKitchen' | 'roomLiving' | 'roomBedroom' | 'roomOutdoor' | 'roomGeneral'> = {
    bathroom: 'roomBathroom',
    kitchen:  'roomKitchen',
    living:   'roomLiving',
    bedroom:  'roomBedroom',
    outdoor:  'roomOutdoor',
    general:  'roomGeneral',
}

interface Props {
    room: TaskRoom
    tasks: Task[]
    members: Member[]
    currentMemberId?: string
    onComplete: (task: Task) => void
    onDelete: (task: Task) => void
}

export function TaskRoomGroup({ room, tasks, members, currentMemberId, onComplete, onDelete }: Props) {
    const { t } = useI18n()
    const def = ROOM_DEFS[room]
    const label = t.home[ROOM_I18N_KEY[room]]

    const sorted = [...tasks].sort(
        (a, b) => URGENCY_ORDER[getTaskUrgency(a)] - URGENCY_ORDER[getTaskUrgency(b)],
    )

    return (
        <div className="trg-group">
            <div className="trg-header">
                <span className="trg-icon">{def.icon}</span>
                <span className="trg-label">{label}</span>
                <span className="trg-count">{tasks.length}</span>
            </div>
            <div className="trg-list">
                {sorted.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        members={members}
                        currentMemberId={currentMemberId}
                        onComplete={onComplete}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    )
}
