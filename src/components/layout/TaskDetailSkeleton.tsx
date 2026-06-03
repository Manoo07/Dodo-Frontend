import S from '../ui/SkeletonBlock'

function SubtaskRow({ w }: { w: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, padding: '0 4px' }}>
      <S w={16} h={16} rounded={8} />
      <S w={w} h={10} />
    </div>
  )
}

export default function TaskDetailSkeleton() {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-bg-primary overflow-hidden">
      {/* Toolbar */}
      <div
        className="border-b border-border flex items-center shrink-0"
        style={{ height: 44, padding: '0 16px', gap: 12 }}
      >
        <S w={24} h={24} rounded={6} />
        <S w={24} h={24} rounded={12} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
        <S w={80} h={13} rounded={6} />
        <div style={{ flex: 1 }} />
        <S w={24} h={24} rounded={6} />
      </div>

      {/* Notes pane */}
      <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', padding: '20px 22px 16px', minHeight: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <S w={70} h={9} rounded={4} />
          <S w={10} h={9} rounded={3} />
          <S w={90} h={9} rounded={4} />
        </div>

        {/* Title */}
        <S w="78%" h={22} rounded={6} style={{ marginBottom: 18 }} />

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <S w={60} h={22} rounded={11} />
          <S w={80} h={22} rounded={11} />
        </div>

        {/* Description lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <S w="92%" h={11} />
          <S w="85%" h={11} />
          <S w="76%" h={11} />
          <div style={{ height: 8 }} />
          <S w="88%" h={11} />
          <S w="62%" h={11} />
          <div style={{ height: 8 }} />
          {/* Code block stub */}
          <div
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 7,
            }}
          >
            <S w="70%" h={10} />
            <S w="55%" h={10} />
            <S w="82%" h={10} />
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />

      {/* Subtasks pane */}
      <div
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          padding: '14px 20px 12px',
        }}
      >
        <S w={68} h={10} rounded={4} style={{ marginBottom: 10, opacity: 0.5 }} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SubtaskRow w="68%" />
          <SubtaskRow w="52%" />
          <SubtaskRow w="75%" />
          <SubtaskRow w="44%" />
          <SubtaskRow w="60%" />
        </div>
        {/* Add subtask link stub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, opacity: 0.4 }}>
          <S w={14} h={14} rounded={3} />
          <S w={80} h={11} rounded={4} />
        </div>
      </div>

      {/* Footer */}
      <div
        className="border-t border-border flex items-center justify-between shrink-0"
        style={{ padding: '8px 20px' }}
      >
        <S w={70} h={11} rounded={5} />
        <div style={{ display: 'flex', gap: 6 }}>
          <S w={26} h={26} rounded={6} />
          <S w={26} h={26} rounded={6} />
          <S w={26} h={26} rounded={6} />
        </div>
      </div>
    </main>
  )
}
