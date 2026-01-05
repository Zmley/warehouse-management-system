import React from 'react'
import { Box, Typography } from '@mui/material'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AddIcon from '@mui/icons-material/Add'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useTranslation } from 'react-i18next'
import { BOTTOMBAR_HEIGHT } from 'pages/Dashboard'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
  onPublishClick: () => void
  onInventoryClick: () => void
  onQueryClick: () => void
  activeTab: 'tasks' | 'publish' | 'cart' | 'inventory' | 'query'
}

const WokerBottomBarComponent: React.FC<BottomBarProps> = ({
  onCartClick,
  onTaskListClick,
  onPublishClick,
  onInventoryClick,
  onQueryClick,
  activeTab
}) => {
  const { t } = useTranslation()
  const isActive = React.useCallback(
    (tab: string) => activeTab === tab,
    [activeTab]
  )
  const colorFor = (tab: string) => (isActive(tab) ? '#2563eb' : '#6b7280')

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOMBAR_HEIGHT,
        backgroundColor: '#fff',
        boxShadow: '0 -1px 6px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 1200,
        pb: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <BottomBarItem
        icon={
          <AssignmentOutlinedIcon
            sx={{ fontSize: 22, color: colorFor('tasks') }}
          />
        }
        label={t('bottombar.tasks')}
        onClick={onTaskListClick}
        isActive={isActive('tasks')}
      />

      <BottomBarItem
        icon={
          <SearchOutlinedIcon sx={{ fontSize: 22, color: colorFor('query') }} />
        }
        label={t('bottombar.query')}
        onClick={onQueryClick}
        isActive={isActive('query')}
      />

      <BottomBarItem
        icon={
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </Box>
        }
        label={t('bottombar.publish')}
        onClick={onPublishClick}
        isActive={isActive('publish')}
      />

      <BottomBarItem
        icon={
          <Box
            component='img'
            src='/forklift.svg'
            alt='Forklift'
            sx={{
              width: 22,
              height: 22,
              filter: isActive('cart') ? 'none' : 'grayscale(1) brightness(.9)'
            }}
          />
        }
        label={t('bottombar.cart')}
        onClick={onCartClick}
        isActive={isActive('cart')}
      />

      <BottomBarItem
        icon={
          <Inventory2OutlinedIcon
            sx={{ fontSize: 22, color: colorFor('inventory') }}
          />
        }
        label={t('bottombar.inventory')}
        onClick={onInventoryClick}
        isActive={isActive('inventory')}
      />
    </Box>
  )
}

const BottomBarItem: React.FC<{
  icon: React.ReactNode
  label: string
  onClick: () => void
  isActive: boolean
}> = ({ icon, label, onClick, isActive }) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      height: '100%',
      backgroundColor: isActive ? '#f0f9ff' : 'transparent',
      transition: 'background-color 0.2s ease'
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform:
          'translateY(calc(-6px - (env(safe-area-inset-bottom, 0px) / 2)))'
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: 12,
          mt: 0.2,
          color: isActive ? '#2563eb' : '#6b7280',
          transition: 'color 0.2s ease'
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
)
export default React.memo(WokerBottomBarComponent)
