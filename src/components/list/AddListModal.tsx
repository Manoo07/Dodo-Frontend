import { useState } from 'react'
import { List, LayoutGrid, GanttChart, ChevronDown, Ban } from 'lucide-react'
import Modal from '../ui/Modal'
import { useDataStore } from '../../store/useDataStore'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/cn'
import type { LucideIcon } from 'lucide-react'

const LIST_COLORS = [
  { id: 'none', label: 'None', value: null },
  { id: 'red', label: 'Red', value: '#FF3B30' },
  { id: 'orange', label: 'Orange', value: '#FF9500' },
  { id: 'yellow', label: 'Yellow', value: '#FFCC00' },
  { id: 'green', label: 'Green', value: '#34C759' },
  { id: 'lightblue', label: 'Light Blue', value: '#5AC8FA' },
  { id: 'blue', label: 'Blue', value: '#4A90D9' },
  { id: 'purple', label: 'Purple', value: '#AF52DE' },
  { id: 'rainbow', label: 'Rainbow', value: 'rainbow' },
] as const

const VIEW_TYPES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'list', label: 'List', icon: List },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: GanttChart },
]

interface AddListModalProps {
  open: boolean
  onClose: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[13px] font-medium text-text-secondary mb-3">{children}</span>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="add-list-select"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          strokeWidth={1.75}
        />
      </div>
    </div>
  )
}

function ListPreview({ name, previewColor }: { name: string; previewColor: string }) {
  const displayName = name.trim() || 'New List'

  return (
    <div className="add-list-preview-pane">
      <p className="add-list-preview-label">Preview</p>
      <div className="add-list-preview-sidebar">
        <div className="add-list-preview-sidebar-header">
          <span className="add-list-preview-section-label">Lists</span>
        </div>
        <div className="add-list-preview-list">
          <div className="add-list-preview-item add-list-preview-item-ghost">
            <span className="add-list-preview-dot" style={{ backgroundColor: '#636366' }} />
            <span className="add-list-preview-item-name">Inbox</span>
          </div>
          <div className="add-list-preview-item add-list-preview-item-active">
            <span className="add-list-preview-dot" style={{ background: previewColor }} />
            <span className="add-list-preview-item-name">{displayName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddListModal({ open, onClose }: AddListModalProps) {
  const folders = useDataStore((s) => s.folders)
  const createList = useDataStore((s) => s.createList)

  const [name, setName] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [viewType, setViewType] = useState('list')
  const [folderId, setFolderId] = useState('none')
  const [listType, setListType] = useState('task')
  const [smartList, setSmartList] = useState('all')

  function resetForm() {
    setName('')
    setColor(null)
    setViewType('list')
    setFolderId('none')
    setListType('task')
    setSmartList('all')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSave() {
    if (!name.trim()) return
    const resolvedColor = color === 'rainbow' ? '#4A90D9' : (color ?? '#636369')
    const list = createList({
      name: name.trim(),
      icon: '📋',
      color: resolvedColor,
      folderId: folderId === 'none' ? null : folderId,
    })
    useAppStore.getState().navigateToList(list.id)
    resetForm()
    onClose()
  }

  const previewColor =
    color === 'rainbow'
      ? 'linear-gradient(135deg, #FF3B30, #FF9500, #FFCC00, #34C759, #5AC8FA, #4A90D9, #AF52DE)'
      : (color ?? '#636366')

  const folderOptions = [
    { value: 'none', label: 'None' },
    ...folders.map((f) => ({ value: f.id, label: f.name })),
  ]

  return (
    <Modal open={open} onClose={handleClose} fullscreen>
      <div className="add-list-dialog">
        <div className="add-list-titlebar">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <h2 id="add-list-title" className="text-sm font-semibold text-text-primary">
            Add List
          </h2>
        </div>

        <div className="add-list-body">
          <div className="add-list-form">
            <div className="add-list-name-input">
              <List className="h-[18px] w-[18px] text-text-muted shrink-0" strokeWidth={1.75} />
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Name"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
            </div>

            <div>
              <FieldLabel>List Color</FieldLabel>
              <div className="flex flex-wrap items-center gap-2.5">
                {LIST_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.value)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                      color === c.value
                        ? 'border-white scale-110 shadow-md'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={
                      c.id === 'none'
                        ? {
                            background: 'var(--color-bg-primary)',
                            borderColor: color === null ? '#ffffff' : 'var(--color-border)',
                          }
                        : c.id === 'rainbow'
                          ? {
                              background:
                                'linear-gradient(135deg, #FF3B30, #FF9500, #FFCC00, #34C759, #5AC8FA, #4A90D9, #AF52DE)',
                            }
                          : { backgroundColor: c.value ?? undefined }
                    }
                  >
                    {c.id === 'none' && (
                      <Ban className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>View Type</FieldLabel>
              <div className="add-list-view-toggle">
                {VIEW_TYPES.map((vt) => {
                  const Icon = vt.icon
                  return (
                    <button
                      key={vt.id}
                      type="button"
                      title={vt.label}
                      onClick={() => setViewType(vt.id)}
                      className={cn(
                        'add-list-view-btn',
                        viewType === vt.id && 'add-list-view-btn-active',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </button>
                  )
                })}
              </div>
            </div>

            <SelectField
              label="Folder"
              value={folderId}
              onChange={setFolderId}
              options={folderOptions}
            />

            <SelectField
              label="List Type"
              value={listType}
              onChange={setListType}
              options={[
                { value: 'task', label: 'Task List' },
                { value: 'note', label: 'Note List' },
              ]}
            />

            <SelectField
              label="Show in Smart List"
              value={smartList}
              onChange={setSmartList}
              options={[
                { value: 'all', label: 'All tasks' },
                { value: 'today', label: 'Today only' },
                { value: 'none', label: "Don't show" },
              ]}
            />

            <div className="add-list-actions">
              <button type="button" onClick={handleClose} className="add-list-btn-cancel">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="add-list-btn-save"
              >
                Save
              </button>
            </div>
          </div>

          <ListPreview name={name} previewColor={previewColor} />
        </div>
      </div>
    </Modal>
  )
}
