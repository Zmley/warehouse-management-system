import { useCallback, useEffect, useMemo, useState } from 'react'
import { Location } from 'react-router-dom'

const RELOAD_BANNER_KEY = 'wms_reload_banner_once'
const SWITCHING_KEY = 'wms_switching_overlay'
const SWITCHING_MSG_KEY = 'wms_switching_overlay_msg'
const TARGET_WID_KEY = 'wms_switching_target_wid'

type WarehouseLike = {
  warehouseID: string | number
  warehouseCode?: string
}

type UserProfileLike = {
  warehouseID?: string | number
  warehouseCode?: string
}

type Translate = (key: string, options?: Record<string, unknown>) => string

type UseWarehouseSwitchingArgs<T extends UserProfileLike> = {
  t: Translate
  location: Location
  currentWarehouseID: string
  warehouses: WarehouseLike[]
  changeUserWarehouse: (wid: string) => Promise<unknown>
  userProfile?: T
  setUserProfile?: (profile: T) => void
}

export const useWarehouseSwitching = <T extends UserProfileLike>({
  t,
  location,
  currentWarehouseID,
  warehouses,
  changeUserWarehouse,
  userProfile,
  setUserProfile
}: UseWarehouseSwitchingArgs<T>) => {
  const [changing, setChanging] = useState(false)
  const [showReloadToast, setShowReloadToast] = useState(false)
  const [showOverlay, setShowOverlay] = useState(
    () => sessionStorage.getItem(SWITCHING_KEY) === '1'
  )
  const [overlayText, setOverlayText] = useState(
    sessionStorage.getItem(SWITCHING_MSG_KEY) || t('topbar.switchingWarehouse')
  )

  const clearOverlay = useCallback(() => {
    sessionStorage.removeItem(SWITCHING_KEY)
    sessionStorage.removeItem(SWITCHING_MSG_KEY)
    sessionStorage.removeItem(TARGET_WID_KEY)
    setShowOverlay(false)
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem(RELOAD_BANNER_KEY) === '1') {
      sessionStorage.removeItem(RELOAD_BANNER_KEY)
      setShowReloadToast(true)
    }
  }, [])

  useEffect(() => {
    if (!showOverlay) return
    const targetWid = sessionStorage.getItem(TARGET_WID_KEY)
    if (!targetWid) return
    if (targetWid === currentWarehouseID) {
      requestAnimationFrame(() => {
        clearOverlay()
      })
    }
  }, [showOverlay, currentWarehouseID, clearOverlay])

  useEffect(() => {
    const handler = () => clearOverlay()
    window.addEventListener('wms:initial-data-ready', handler)
    return () => window.removeEventListener('wms:initial-data-ready', handler)
  }, [clearOverlay])

  useEffect(() => {
    if (!showOverlay) return
    const close = () => clearOverlay()
    window.addEventListener('pageshow', close, { once: true })
    window.addEventListener('load', close, { once: true })
    return () => {
      window.removeEventListener('pageshow', close as any)
      window.removeEventListener('load', close as any)
    }
  }, [showOverlay, clearOverlay])

  useEffect(() => {
    if (!showOverlay) return
    const t = setTimeout(() => {
      clearOverlay()
    }, 100)
    return () => clearTimeout(t)
  }, [showOverlay, clearOverlay])

  const buildTargetUrl = useCallback(
    (wid: string) => {
      const parts = location.pathname.split('/')
      const idx = parts.findIndex(
        p => p === 'admin-management' || p === 'tasks' || p === 'inventory'
      )
      if (idx >= 0) {
        if (parts[idx + 1]) parts[idx + 1] = wid
        else parts.splice(idx + 1, 0, wid)
        return parts.join('/') + location.search
      }
      return location.pathname + location.search
    },
    [location.pathname, location.search]
  )

  const onSelectWarehouse = useCallback(
    async (wid: string, onCloseMenu: () => void) => {
      if (!wid || wid === currentWarehouseID) {
        onCloseMenu()
        return
      }

      const pickedCode =
        warehouses.find(w => String(w.warehouseID) === String(wid))
          ?.warehouseCode || t('topbar.loading')

      onCloseMenu()

      try {
        setChanging(true)

        const msg = t('topbar.switchingTo', { code: pickedCode })
        sessionStorage.setItem(SWITCHING_KEY, '1')
        sessionStorage.setItem(SWITCHING_MSG_KEY, msg)
        sessionStorage.setItem(TARGET_WID_KEY, String(wid))
        setOverlayText(msg)
        setShowOverlay(true)

        await changeUserWarehouse(wid)

        if (setUserProfile && userProfile) {
          setUserProfile({
            ...userProfile,
            warehouseID: wid,
            warehouseCode: pickedCode
          })
        }

        sessionStorage.setItem(RELOAD_BANNER_KEY, '1')

        const targetUrl = buildTargetUrl(wid)
        window.location.replace(targetUrl)
      } catch (e) {
        console.error('Failed to change warehouse', e)
        clearOverlay()
      } finally {
        setChanging(false)
      }
    },
    [
      buildTargetUrl,
      changeUserWarehouse,
      clearOverlay,
      currentWarehouseID,
      setUserProfile,
      t,
      userProfile,
      warehouses
    ]
  )

  const hasWarehouses = useMemo(
    () => Array.isArray(warehouses) && warehouses.length > 0,
    [warehouses]
  )

  return {
    changing,
    showReloadToast,
    setShowReloadToast,
    showOverlay,
    overlayText,
    hasWarehouses,
    onSelectWarehouse
  }
}
