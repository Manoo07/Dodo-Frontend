import { useEffect } from 'react'
import { useDataStore } from '../store/useDataStore'

/** Trigger data hydration on mount. No list is auto-selected — user chooses. */
export function useDefaultListView() {
  const hydrate = useDataStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])
}
