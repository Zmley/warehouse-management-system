import React from 'react'
import { Box, Typography } from '@mui/material'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AddIcon from '@mui/icons-material/Add'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useTranslation } from 'react-i18next'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
  onPublishClick: () => void
  onInventoryClick: () => void
  onQueryClick: () => void
  activeTab: 'tasks' | 'publish' | 'cart' | 'inventory' | 'query'
}

const WokerBottomBar: React.FC<BottomBarProps> = ({
  onCartClick,
  onTaskListClick,
  onPublishClick,
  onInventoryClick,
  onQueryClick,
  activeTab
}) => {
  const { t } = useTranslation()

  const getColor = (tab: string) => (activeTab === tab ? '#2563eb' : '#9ca3af')
  const getFilter = (tab: string) =>
    activeTab === tab
      ? 'invert(34%) sepia(93%) saturate(1939%) hue-rotate(210deg) brightness(93%) contrast(92%)'
      : 'invert(60%) sepia(6%) saturate(220%) hue-rotate(174deg) brightness(90%) contrast(85%)'

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        backgroundColor: '#fff',
        boxShadow: '0 -1px 6px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 1200
      }}
    >
      <BottomBarItem
        icon={
          <AssignmentOutlinedIcon
            sx={{ fontSize: 22, color: getColor('tasks') }}
          />
        }
        label={t('bottombar.tasks')}
        onClick={onTaskListClick}
        isActive={activeTab === 'tasks'}
      />

      <BottomBarItem
        icon={
          <SearchOutlinedIcon sx={{ fontSize: 22, color: getColor('query') }} />
        }
        label={t('bottombar.query')}
        onClick={onQueryClick}
        isActive={activeTab === 'query'}
      />

      <BottomBarItem
        icon={
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </Box>
        }
        label={t('bottombar.publish')}
        onClick={onPublishClick}
        isActive={activeTab === 'publish'}
      />

      {/* Cart */}
      <BottomBarItem
        icon={
          <Box
            component='img'
            src='/forklift.svg'
            alt='Forklift'
            sx={{
              width: 22,
              height: 22,
              filter: getFilter('cart'),
              transition: 'filter 0.3s ease'
            }}
          />
        }
        label={t('bottombar.cart')}
        onClick={onCartClick}
        isActive={activeTab === 'cart'}
      />

      {/* Inventory */}
      <BottomBarItem
        icon={
          <Inventory2OutlinedIcon
            sx={{ fontSize: 22, color: getColor('inventory') }}
          />
        }
        label={t('bottombar.inventory')}
        onClick={onInventoryClick}
        isActive={activeTab === 'inventory'}
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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      height: '100%',
      backgroundColor: isActive ? '#f0f9ff' : 'transparent',
      transition: 'background-color 0.3s ease-in-out',
      '&:hover': { backgroundColor: '#f3f4f6' }
    }}
  >
    <Box
      sx={{
        width: 22,
        height: 22,
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
        fontSize: 11,
        mt: 0.4,
        color: isActive ? '#2563eb' : '#9ca3af',
        transition: 'color 0.3s ease'
      }}
    >
      {label}
    </Typography>
  </Box>
)

export default WokerBottomBar
