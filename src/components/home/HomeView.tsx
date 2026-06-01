// src/components/home/HomeView.tsx
import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { useConfirm, useToast } from '../../contexts/ui'
import { useTasks } from '../../hooks/useTasks'
import { useShoppingList } from '../../hooks/useShoppingList'
import { TasksView } from './tasks/TasksView'
import { AddTaskModal } from './tasks/AddTaskModal'
import { ShoppingView } from './shopping/ShoppingView'
import type { Task } from '../../types/home'
import type { Member } from '../../types'
import './HomeView.css'

type HomeTab = 'tasks' | 'shopping'

interface Props {
    householdId: string
    members: Member[]
    currentMemberId?: string
}

export function HomeView({ householdId, members, currentMemberId }: Props) {
    const { t } = useI18n()
    const h = t.home
    const { showConfirm } = useConfirm()
    const { showToast } = useToast()

    const { tasks, add: addTask, remove: removeTask, complete: completeTask } = useTasks(householdId)
    const { items, add: addItem, toggle: toggleItem, remove: removeItem, clearDone } = useShoppingList(householdId)

    const [tab, setTab] = useState<HomeTab>('tasks')
    const [showAddTask, setShowAddTask] = useState(false)

    const handleCompleteTask = (task: Task) => completeTask(task)

    const handleDeleteTask = async (task: Task) => {
        const confirmed = await showConfirm({
            title: h.deleteTask,
            sub: `"${task.title}"?`,
            danger: true,
        })
        if (confirmed) removeTask(task.id)
    }

    const handleAddTask = async (task: Omit<Task, 'id'>) => {
        try {
            await addTask(task)
        } catch {
            showToast(h.addTaskError)
        }
    }

    const handleToggleItem = (id: string, done: boolean) =>
        toggleItem(id, done, currentMemberId)

    return (
        <div className="hv-root">
            {/* Tab switcher */}
            <div className="hv-tabs">
                <button
                    className={`hv-tab${tab === 'tasks' ? ' hv-tab--active' : ''}`}
                    onClick={() => setTab('tasks')}
                >
                    <span>✅</span>
                    {h.tabTasks}
                    {tasks.length > 0 && <span className="hv-badge">{tasks.length}</span>}
                </button>
                <button
                    className={`hv-tab${tab === 'shopping' ? ' hv-tab--active' : ''}`}
                    onClick={() => setTab('shopping')}
                >
                    <span>🛒</span>
                    {h.tabShopping}
                    {items.filter((i) => !i.done).length > 0 && (
                        <span className="hv-badge">{items.filter((i) => !i.done).length}</span>
                    )}
                </button>
            </div>

            {/* Content */}
            {tab === 'tasks' && (
                <TasksView
                    tasks={tasks}
                    members={members}
                    currentMemberId={currentMemberId}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onAdd={() => setShowAddTask(true)}
                />
            )}

            {tab === 'shopping' && (
                <ShoppingView
                    items={items}
                    members={members}
                    onAdd={(text) => addItem(text, currentMemberId ?? '')}
                    onToggle={handleToggleItem}
                    onDelete={removeItem}
                    onClearDone={clearDone}
                />
            )}

            {showAddTask && (
                <AddTaskModal
                    members={members}
                    currentMemberId={currentMemberId}
                    onAdd={handleAddTask}
                    onClose={() => setShowAddTask(false)}
                />
            )}
        </div>
    )
}
