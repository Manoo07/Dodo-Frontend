import S from '../ui/SkeletonBlock'

function TaskRow({ w, indent = 0, withDate }: { w: string; indent?: number; withDate?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 34, padding: `0 8px 0 ${10 + indent * 20}px`,
        margin: '0 4px',
      }}
    >
      <S w={18} h={18} rounded={9} />
      <S w={w} h={11} />
      {withDate && <S w={52} h={11} className="ml-auto" />}
    </div>
  )
}

function SectionGroup({ name, tasks }: { name: string; tasks: { w: string; indent?: number; withDate?: boolean }[] }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 32, padding: '0 16px' }}>
        <S w={14} h={14} rounded={3} />
        <S w={name} h={12} />
      </div>
      {/* Task rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {tasks.map((t, i) => (
          <TaskRow key={i} {...t} />
        ))}
      </div>
    </div>
  )
}

export default function TaskListSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
      {/* Panel header */}
      <div
        className="border-b border-border flex items-center justify-between shrink-0"
        style={{ height: 44, padding: '0 16px' }}
      >
        <S w="38%" h={14} rounded={7} />
        <div style={{ display: 'flex', gap: 6 }}>
          <S w={28} h={28} rounded={7} />
          <S w={28} h={28} rounded={7} />
        </div>
      </div>

      {/* Add task bar */}
      <div style={{ padding: '4px 12px 6px' }}>
        <div
          style={{
            height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
            gap: 10, padding: '0 12px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <S w={14} h={14} rounded={3} />
          <S w="55%" h={10} />
        </div>
      </div>

      {/* Task groups */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4, paddingBottom: 16 }}>
        <SectionGroup
          name="90px"
          tasks={[
            { w: '72%', withDate: true },
            { w: '55%' },
            { w: '48%', indent: 1, withDate: true },
            { w: '61%', indent: 1 },
          ]}
        />
        <SectionGroup
          name="70px"
          tasks={[
            { w: '65%' },
            { w: '78%', withDate: true },
            { w: '44%' },
          ]}
        />
        <SectionGroup
          name="80px"
          tasks={[
            { w: '58%', withDate: true },
            { w: '70%' },
            { w: '52%' },
            { w: '45%', withDate: true },
            { w: '68%' },
          ]}
        />
      </div>
    </div>
  )
}
