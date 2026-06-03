import S from '../ui/SkeletonBlock'

function NavRow({ w }: { w: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 10px' }}>
      <S w={18} h={18} rounded={5} />
      <S w={w} h={11} />
    </div>
  )
}

function ListRow({ w, badge }: { w: string; badge?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 10px' }}>
      <S w={16} h={16} rounded={8} />
      <S w={w} h={11} />
      {badge && <S w={22} h={16} rounded={8} className="ml-auto" />}
    </div>
  )
}

export default function SidebarSkeleton() {
  return (
    <aside
      className="border-r border-border flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-bg-sidebar)' }}
    >
      {/* Top nav */}
      <div style={{ padding: '14px 20px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavRow w="44%" />
        <NavRow w="55%" />
        <NavRow w="36%" />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 20px' }} />

      {/* Lists section */}
      <div style={{ padding: '10px 20px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <S w="38px" h={9} style={{ marginBottom: 6, opacity: 0.5 }} />
        <ListRow w="52%" badge />
        <ListRow w="40%" badge />
        <ListRow w="62%" />
        <ListRow w="46%" badge />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 20px' }} />

      {/* Filters stub */}
      <div style={{ padding: '10px 20px 6px' }}>
        <S w="38px" h={9} style={{ marginBottom: 8, opacity: 0.5 }} />
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <S w="72%" h={9} />
          <S w="55%" h={9} />
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 20px' }} />

      {/* Tags stub */}
      <div style={{ padding: '10px 20px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <S w="34px" h={9} style={{ marginBottom: 4, opacity: 0.5 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 10px' }}>
          <S w={8} h={8} rounded={4} />
          <S w="48%" h={10} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 10px' }}>
          <S w={8} h={8} rounded={4} />
          <S w="36%" h={10} />
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      <div style={{ padding: '10px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavRow w="48%" />
        <NavRow w="32%" />
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px' }}>
          <S w={30} h={30} rounded={15} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <S w="55%" h={11} />
            <S w="70%" h={9} />
          </div>
        </div>
      </div>
    </aside>
  )
}
