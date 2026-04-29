import { useEffect, useRef } from 'react'

/** Triggers `load` when `sentinelRef` nears the viewport (nested scroll friendly). */
export function useIntersectLoadMore(
  load: () => void | Promise<void>,
  enabled: boolean,
  rootMargin = '320px'
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) void loadRef.current()
      },
      { root: null, rootMargin, threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
