import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useDataStore } from '../store/useDataStore'

/** Load data from the API and navigate to the Learning list on first load. */
export function useDefaultListView() {
  const initialized = useRef(false)
  const navigateToList = useAppStore((s) => s.navigateToList)
  const lists = useDataStore((s) => s.lists)
  const hydrated = useDataStore((s) => s.hydrated)
  const hydrate = useDataStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated || initialized.current || lists.length === 0) return
    initialized.current = true

    const learning = lists.find((l) => l.name.toLowerCase() === 'learning')
    if (learning) {
      navigateToList(learning.id)
    }
  }, [hydrated, lists, navigateToList])
}
