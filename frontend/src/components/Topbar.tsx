import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  Box,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
  CircularProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Button,
  Snackbar,
  Alert
} from '@mui/material'
import {
  Menu as MenuIcon,
  Check as CheckIcon,
  WarehouseOutlined as WarehouseIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import ProfileDrawer from 'pages/Profile'
import { TOPBAR_HEIGHT } from 'pages/Dashboard'
import useWarehouses from 'hooks/useWarehouse'
import { useAuth } from 'hooks/useAuth'
import { AuthContext } from 'contexts/auth'
import { useLocation } from 'react-router-dom'
import { useWarehouseSwitching } from 'hooks/useWarehouseSwitching'

const TopBar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  const location = useLocation()

  const { warehouses, fetchWarehouses } = useWarehouses()
  const [whLoading, setWhLoading] = useState(false)

  const { changeUserWarehouse } = useAuth()
  const auth = useContext(AuthContext)
  const userProfile = auth?.userProfile
  const setUserProfile = auth?.setUserProfile

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget)
  const closeMenu = () => setAnchorEl(null)
  const menuOpen = Boolean(anchorEl)

  const currentWarehouseID = useMemo(
    () => String(userProfile?.warehouseID || ''),
    [userProfile?.warehouseID]
  )
  const currentCode = userProfile?.warehouseCode || t('topbar.loading')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setWhLoading(true)
        await fetchWarehouses()
      } finally {
        if (mounted) setWhLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [fetchWarehouses])

  const {
    changing,
    showReloadToast,
    setShowReloadToast,
    showOverlay,
    overlayText,
    hasWarehouses,
    onSelectWarehouse
  } = useWarehouseSwitching({
    t,
    location,
    currentWarehouseID,
    warehouses,
    changeUserWarehouse,
    userProfile,
    setUserProfile
  })

  return (
    <>
      <Box
        sx={{
          height: TOPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 4px 10px rgba(15,23,42,0.04)'
        }}
      >
        <IconButton onClick={() => setDrawerOpen(true)} aria-label='open menu'>
          <MenuIcon sx={{ fontSize: 22, color: '#111827' }} />
        </IconButton>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Tooltip
            title={
              changing
                ? t('topbar.switchingWarehouse')
                : t('topbar.selectWarehouse')
            }
          >
            <span>
              <Button
                onClick={openMenu}
                disabled={changing}
                aria-label='select warehouse'
                disableElevation
                variant='outlined'
                startIcon={<WarehouseIcon sx={{ fontSize: 16 }} />}
                endIcon={
                  changing ? (
                    <CircularProgress size={14} thickness={5} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18 }} />
                  )
                }
                sx={{
                  height: 30,
                  minWidth: 220,
                  maxWidth: 320,
                  px: 1.25,
                  borderRadius: 8,
                  textTransform: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#0f172a',
                  borderColor: '#e2e8f0',
                  background:
                    'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    background:
                      'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
                  },
                  '&:active': { transform: 'translateY(0.5px)' }
                }}
              >
                {currentCode}
              </Button>
            </span>
          </Tooltip>

          <Menu
            open={menuOpen}
            anchorEl={anchorEl}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{
              sx: {
                mt: 0.8,
                borderRadius: 2,
                boxShadow:
                  '0 10px 24px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)',
                minWidth: 260,
                maxWidth: 360,
                '& .MuiMenuItem-root': { minHeight: 34, fontSize: 13 }
              }
            }}
          >
            {hasWarehouses ? (
              warehouses.map(w => {
                const wid = String(w.warehouseID)
                const selected = wid === currentWarehouseID
                return (
                  <MenuItem
                    key={wid}
                    onClick={() => onSelectWarehouse(wid, closeMenu)}
                    disabled={changing}
                    selected={selected}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      '&.Mui-selected': { bgcolor: 'rgba(37,99,235,0.08)' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {selected ? (
                        <CheckIcon fontSize='small' />
                      ) : (
                        <WarehouseIcon fontSize='small' />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={w.warehouseCode}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontWeight: selected ? 800 : 600
                      }}
                    />
                  </MenuItem>
                )
              })
            ) : (
              <MenuItem disabled>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <WarehouseIcon fontSize='small' />
                </ListItemIcon>
                <ListItemText
                  primary={
                    whLoading
                      ? t('topbar.loadingWarehouseList')
                      : t('topbar.noWarehouse')
                  }
                  primaryTypographyProps={{ noWrap: true, fontWeight: 600 }}
                />
              </MenuItem>
            )}
          </Menu>
        </Box>

        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={!isZh}
              onChange={() => {
                const newLang = isZh ? 'en' : 'zh'
                i18n.changeLanguage(newLang)
              }}
              color='primary'
            />
          }
          label={isZh ? t('topbar.zhLabel') : t('topbar.enLabel')}
          labelPlacement='start'
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: 12,
              fontWeight: 700,
              color: '#2563eb'
            }
          }}
        />
      </Box>

      <Snackbar
        open={showReloadToast}
        autoHideDuration={2000}
        onClose={() => setShowReloadToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowReloadToast(false)}
          severity='success'
          variant='filled'
          sx={{ fontWeight: 700 }}
        >
          {t('topbar.warehouseUpdated')}
        </Alert>
      </Snackbar>

      {showOverlay && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(2px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            transition: 'opacity 180ms ease',
            opacity: 1
          }}
        >
          <CircularProgress size={24} thickness={5} />
          <Box sx={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
            {overlayText || t('topbar.switchingWarehouse')}
          </Box>
        </Box>
      )}

      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default TopBar
