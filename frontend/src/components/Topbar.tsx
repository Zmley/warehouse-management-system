// src/components/Topbar.tsx
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
  Button
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

const TopBar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  // 仓库
  const { warehouses, fetchWarehouses } = useWarehouses()
  const [whLoading, setWhLoading] = useState(false)

  // 切仓
  const { changeUserWarehouse } = useAuth()
  const [changing, setChanging] = useState(false)

  // 用户资料（同步当前选项）
  const auth = useContext(AuthContext)
  const userProfile = auth?.userProfile
  const setUserProfile = auth?.setUserProfile

  // 当前仓库
  const [currentWarehouseID, setCurrentWarehouseID] = useState<string>('')

  // 菜单
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget)
  const closeMenu = () => setAnchorEl(null)
  const menuOpen = Boolean(anchorEl)

  // 拉仓库列表
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

  // 同步默认仓库
  useEffect(() => {
    if (userProfile?.warehouseID)
      setCurrentWarehouseID(String(userProfile.warehouseID))
  }, [userProfile?.warehouseID])

  const hasWarehouses = useMemo(
    () => Array.isArray(warehouses) && warehouses.length > 0,
    [warehouses]
  )

  const onSelectWarehouse = async (wid: string) => {
    if (!wid || wid === currentWarehouseID) {
      closeMenu()
      return
    }
    setCurrentWarehouseID(wid)
    try {
      setChanging(true)
      await changeUserWarehouse(wid)
      if (setUserProfile && userProfile) {
        setUserProfile({ ...userProfile, warehouseID: wid })
      }
      // 保持你的刷新逻辑
      window.location.reload()
    } catch (e) {
      console.error('Failed to change warehouse', e)
    } finally {
      setChanging(false)
      closeMenu()
    }
  }

  const currentCode =
    warehouses.find(w => String(w.warehouseID) === String(currentWarehouseID))
      ?.warehouseCode || (isZh ? '选择仓库' : 'Select warehouse')

  return (
    <>
      <Box
        sx={{
          height: TOPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 16 / 8,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 4px 10px rgba(15,23,42,0.04)'
        }}
      >
        {/* 左：菜单 */}
        <IconButton onClick={() => setDrawerOpen(true)} aria-label='open menu'>
          <MenuIcon sx={{ fontSize: 22, color: '#111827' }} />
        </IconButton>

        {/* 中：方正、紧凑、居中的选择器 */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Tooltip
            title={
              whLoading
                ? isZh
                  ? '正在加载仓库…'
                  : 'Loading warehouses…'
                : isZh
                  ? '选择仓库'
                  : 'Select warehouse'
            }
          >
            <span>
              <Button
                onClick={openMenu}
                disabled={!hasWarehouses || whLoading || changing}
                aria-label='select warehouse'
                disableElevation
                variant='outlined'
                startIcon={<WarehouseIcon sx={{ fontSize: 16 }} />}
                endIcon={
                  whLoading || changing ? (
                    <CircularProgress size={14} thickness={5} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18 }} />
                  )
                }
                sx={{
                  height: 30, // 更低高度
                  minWidth: 220,
                  maxWidth: 320,
                  px: 1.25,
                  borderRadius: 8, // 方正（轻圆角）
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

          {/* 仓库菜单 */}
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
            {warehouses.map(w => {
              const selected =
                String(w.warehouseID) === String(currentWarehouseID)
              return (
                <MenuItem
                  key={String(w.warehouseID)}
                  onClick={() => onSelectWarehouse(String(w.warehouseID))}
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
            })}
          </Menu>
        </Box>

        {/* 右：语言开关 */}
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={!isZh}
              onChange={() => {
                const newLang = isZh ? 'en' : 'zh'
                i18n.changeLanguage(newLang)
                localStorage.setItem('i18nextLng', newLang)
              }}
              color='primary'
            />
          }
          label={isZh ? '中文' : 'English'}
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

      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default TopBar
