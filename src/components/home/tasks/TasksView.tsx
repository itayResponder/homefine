// src/components/home/tasks/TasksView.tsx
import { useI18n } from '../../../i18n/context'
import { TaskRoomGroup } from './TaskRoomGroup'
import { ROOM_ORDER } from '../../../constants/rooms'
import type { Task } from '../../../types/home'
import type { Member } from '../../../types'

interface Props {
    tasks: Task[]
    members: Member[]
    currentMemberId?: string
    onComplete: (task: Task) => void
    onDelete: (task: Task) => void
    onAdd: () => void
}

export function TasksView({ tasks, members, currentMemberId, onComplete, onDelete, onAdd }: Props) {
    const { t } = useI18n()
    const h = t.home

    // group tasks by room, only include rooms that have tasks
    const byRoom = ROOM_ORDER
        .map((room) => ({ room, tasks: tasks.filter((tk) => tk.room === room) }))
        .filter(({ tasks: ts }) => ts.length > 0)

    return (
        <div className="tv-root">
            <div className="tv-actions">
                <button className="tv-add-btn sbtn" onClick={onAdd}>
                    {h.addTaskBtn}
                </button>
            </div>

            {tasks.length === 0 ? (
                <p className="tv-empty">{h.noTasks}</p>
            ) : (
                <div className="tv-groups">
                    {byRoom.map(({ room, tasks: roomTasks }) => (
                        <TaskRoomGroup
                            key={room}
                            room={room}
                            tasks={roomTasks}
                            members={members}
                            currentMemberId={currentMemberId}
                            onComplete={onComplete}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
