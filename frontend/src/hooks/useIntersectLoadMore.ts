import { useEffect, useRef } from 'react'

/** Triggers `load` when `sentinelRef` nears the viewport (nested scroll friendly). */
export function useIntersectLoadMore(
  load: () => void | Promise<void>,
  enabled: boolean,
  rootMargin = '0px',
  cooldownMs = 1000
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadRef = useRef(load)
  const loadingRef = useRef(false)
  const wasIntersectingRef = useRef(false)
  const lastFireAtRef = useRef(0)
  loadRef.current = load

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return

        if (!entry.isIntersecting) {
          // Rearm after sentinel leaves viewport, so continuous visibility
          // won't fire load repeatedly and cause spinner flicker.
          wasIntersectingRef.current = false
          return
        }

        if (wasIntersectingRef.current || loadingRef.current) return

        const now = Date.now()
        if (now - lastFireAtRef.current < cooldownMs) return
        lastFireAtRef.current = now

        wasIntersectingRef.current = true
        loadingRef.current = true
        Promise.resolve(loadRef.current()).finally(() => {
          loadingRef.current = false
        })
      },
      { root: null, rootMargin, threshold: 0 }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      loadingRef.current = false
      wasIntersectingRef.current = false
    }
  }, [enabled, rootMargin, cooldownMs])

  return sentinelRef
}
