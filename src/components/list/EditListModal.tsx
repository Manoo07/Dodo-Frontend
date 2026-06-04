import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Ban, ChevronDown } from 'lucide-react'
import { useDataStore } from '../../store/useDataStore'
import { cn } from '../../lib/cn'
import ListIconPicker from '../ui/ListIconPicker'
import type { List } from '../../types'

const LIST_COLORS = [
  { id: 'none',      label: 'None',       value: null },
  { id: 'red',       label: 'Red',        value: '#FF3B30' },
  { id: 'orange',    label: 'Orange',     value: '#FF9500' },
  { id: 'yellow',    label: 'Yellow',     value: '#FFCC00' },
  { id: 'green',     label: 'Green',      value: '#34C759' },
  { id: 'lightblue', label: 'Light Blue', value: '#5AC8FA' },
  { id: 'blue',      label: 'Blue',       value: '#4A90D9' },
  { id: 'purple',    label: 'Purple',     value: '#AF52DE' },
  { id: 'rainbow',   label: 'Rainbow',    value: 'rainbow' },
] as const

interface Props {
  list: List
  onClose: () => void
}

export default function EditListModal({ list, onClose }: Props) {
  const updateList = useDataStore((s) => s.updateList)
  const folders    = useDataStore((s) => s.folders)

  const [name,     setName]     = useState(list.name)
  const [color,    setColor]    = useState<string | null>(list.color ?? null)
  const [folderId, setFolderId] = useState(list.folderId ?? 'none')
  const [iconKey,  setIconKey]  = useState<string | null>(list.icon && list.icon.length < 20 ? list.icon : null)

  // Keep form in sync if list changes externally
  useEffect(() => {
    setName(list.name)
    setColor(list.color ?? null)
    setFolderId(list.folderId ?? 'none')
    setIconKey(list.icon && list.icon.length < 20 ? list.icon : null)
  }, [list.id])

  function handleSave() {
    if (!name.trim()) return
    const resolvedColor = color === 'rainbow' ? '#4A90D9' : (color ?? '#636369')
    updateList(list.id, {
      name:     name.trim(),
      color:    resolvedColor,
      icon:     iconKey ?? '',
      folderId: folderId === 'none' ? null : folderId,
    })
    onClose()
  }

  const folderOptions = [
    { value: 'none', label: 'No folder' },
    ...folders.map((f) => ({ value: f.id, label: f.name })),
  ]

  const accentColor = color === 'rainbow' || !color ? '#5b9bd5' : color

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: '#1e1e22',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          padding: '24px 24px 20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        <h2 className="text-[15px] font-semibold text-text-primary">Edit List</h2>

        {/* Name */}
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="List name"
          className="w-full rounded-xl text-[14px] text-text-primary placeholder:text-text-muted/50 outline-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            height: 44, padding: '0 14px',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(91,155,213,0.6)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        />

        {/* Icon picker */}
        <ListIconPicker value={iconKey} onChange={setIconKey} color={accentColor} />

        {/* Colour */}
        <div>
          <p className="text-[11.5px] font-semibold text-text-muted uppercase tracking-widest mb-3">Colour</p>
          <div className="flex flex-wrap items-center gap-2.5">
            {LIST_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                  color === c.value ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105',
                )}
                style={
                  c.id === 'none'
                    ? { background: 'var(--color-bg-primary)', borderColor: color === null ? '#fff' : 'rgba(255,255,255,0.15)' }
                    : c.id === 'rainbow'
                      ? { background: 'linear-gradient(135deg,#FF3B30,#FF9500,#FFCC00,#34C759,#5AC8FA,#4A90D9,#AF52DE)' }
                      : { backgroundColor: c.value ?? undefined }
                }
              >
                {c.id === 'none' && <Ban className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
              </button>
            ))}
          </div>
        </div>

        {/* Folder */}
        {folders.length > 0 && (
          <div>
            <p className="text-[11.5px] font-semibold text-text-muted uppercase tracking-widest mb-3">Folder</p>
            <div className="relative">
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full rounded-xl text-[13.5px] text-text-primary outline-none appearance-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', height: 44, padding: '0 14px' }}
              >
                {folderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" strokeWidth={1.75} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl text-[13.5px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            style={{ height: 42, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 rounded-xl text-[13.5px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-35"
            style={{ height: 42, background: accentColor }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
