import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense
} from 'react'
import { Box, Button, CircularProgress, Divider } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import InventorySearch from './searchInventory'
import InventoryEdit from './Inventory'
import MobileReceive from './Receiving/MobileReceive'

type TabKey = 'search' | 'edit' | 'receive'

const TAB_ORDER: TabKey[] = ['search', 'edit', 'receive']

const InventoryIndex: React.FC = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabKey>('search')

  const labels = useMemo(
    () => ({
      search: t('inventoryIndex.searchTab'),
      edit: t('inventoryIndex.editTab'),
      receive: t('inventoryIndex.receiveTab')
    }),
    [t]
  )

  const tabs = useMemo(
    () => [
      {
        key: 'search' as TabKey,
        icon: <SearchIcon fontSize='small' />,
        label: labels.search
      },
      {
        key: 'edit' as TabKey,
        icon: <EditIcon fontSize='small' />,
        label: labels.edit
      },
      {
        key: 'receive' as TabKey,
        icon: <LocalShippingIcon fontSize='small' />,
        label: labels.receive
      }
    ],
    [labels]
  )

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))
        return
      if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault()
        const idx = TAB_ORDER.indexOf(tab)
        setTab(TAB_ORDER[(idx + 1) % TAB_ORDER.length])
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault()
        const idx = TAB_ORDER.indexOf(tab)
        setTab(TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length])
      } else if (['1', '2', '3'].includes(e.key)) {
        const i = Number(e.key) - 1
        if (TAB_ORDER[i]) setTab(TAB_ORDER[i])
      }
    },
    [tab]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0
  })

  const updateIndicator = useCallback(() => {
    const root = containerRef.current
    if (!root) return
    const btn = root.querySelector<HTMLButtonElement>(
      `button[data-key="${tab}"]`
    )
    if (!btn) return
    const { left: l1, width } = btn.getBoundingClientRect()
    const { left: l0 } = root.getBoundingClientRect()
    setIndicator({ left: l1 - l0, width })
  }, [tab])

  useEffect(() => {
    updateIndicator()
    const ro = new ResizeObserver(updateIndicator)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [updateIndicator])

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        m: 0,
        p: 0,
        bgcolor: 'transparent'
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 6,
          width: '100%',
          backdropFilter: 'saturate(120%) blur(8px)',
          backgroundColor: theme =>
            theme.palette.mode === 'dark'
              ? 'rgba(10,10,10,0.55)'
              : 'rgba(247,249,252,0.75)',
          borderBottom: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)'
        }}
      >
        <Box
          ref={containerRef}
          role='tablist'
          aria-label={t('inventoryIndex.tablistAria')}
          sx={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 0,
            px: { xs: 1, sm: 2 },
            py: { xs: 0.5, sm: 0.75 }
          }}
        >
          <motion.div
            aria-hidden
            initial={false}
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 32,
              mass: 0.6
            }}
            style={{
              position: 'absolute',
              top: 6,
              height: 'calc(100% - 12px)',
              borderRadius: 14,
              boxShadow: '0 6px 14px rgba(0,0,0,0.10)',
              background:
                'linear-gradient(180deg, rgba(37,99,235,0.92), rgba(29,78,216,0.88))'
            }}
          />

          {tabs.map(({ key, icon, label }) => {
            const active = tab === key
            return (
              <Button
                key={key}
                data-key={key}
                onClick={() => setTab(key)}
                role='tab'
                aria-selected={active}
                aria-label={label}
                disableElevation
                variant='text'
                sx={{
                  minHeight: 44,
                  height: { xs: 42, sm: 46 },
                  borderRadius: 2,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  textTransform: 'none',
                  justifyContent: 'center',
                  px: { xs: 1, sm: 1.5 },
                  mx: 0,
                  color: active ? '#fff' : '#1f2937',
                  '& .MuiButton-startIcon': { mr: 1, ml: 0 },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: active ? '#fff' : '#111827'
                  }
                }}
                startIcon={icon}
              >
                {label}
              </Button>
            )
          })}
        </Box>
        <Divider sx={{ opacity: 0.35 }} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          m: 0,
          p: { xs: 1, sm: 2 },
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? '#0b0b0c' : '#F7F9FC'
        }}
      >
        <Suspense
          fallback={
            <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <CircularProgress size={28} thickness={4} />
            </Box>
          }
        >
          {tab === 'search' && (
            <SectionCard>
              <InventorySearch />
            </SectionCard>
          )}
          {tab === 'edit' && (
            <SectionCard>
              <InventoryEdit />
            </SectionCard>
          )}
          {tab === 'receive' && (
            <SectionCard>
              <MobileReceive />
            </SectionCard>
          )}
        </Suspense>
      </Box>
    </Box>
  )
}

const SectionCard: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Box
    sx={{
      height: '100%',
      bgcolor: theme =>
        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
      border: '1px solid',
      borderColor: 'rgba(0,0,0,0.06)',
      borderRadius: 3,
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      p: { xs: 1.25, sm: 2 }
    }}
  >
    {children}
  </Box>
)

export default InventoryIndex
