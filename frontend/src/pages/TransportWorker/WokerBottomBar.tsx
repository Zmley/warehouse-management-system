import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
  onPublishClick: () => void
  onInventoryClick: () => void
  activeTab: 'tasks' | 'publish' | 'cart' | 'inventory'
}

const WokerBottomBar: React.FC<BottomBarProps> = ({
  onCartClick,
  onTaskListClick,
  onPublishClick,
  onInventoryClick,
  activeTab
}) => {
  const { t } = useTranslation()

  const getColor = (tab: string) => (activeTab === tab ? '#2563eb' : '#9ca3af')
  const getFilter = (tab: string) =>
    activeTab === tab
      ? 'invert(34%) sepia(93%) saturate(1939%) hue-rotate(210deg) brightness(93%) contrast(92%)'
      : 'invert(60%) sepia(6%) saturate(220%) hue-rotate(174deg) brightness(90%) contrast(85%)'
  const isActive = (tab: string) => activeTab === tab

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
      {/* Task List */}
      <BottomBarItem
        icon={
          <AssignmentOutlinedIcon
            sx={{ fontSize: 22, color: getColor('tasks') }}
          />
        }
        label={t('bottombar.tasks')}
        onClick={onTaskListClick}
        isActive={isActive('tasks')}
      />

      {/* Publish */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconButton
          onClick={onPublishClick}
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 2px 8px #3B82F640',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb, #1e40af)'
            }
          }}
        >
          <AddIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography
          variant='caption'
          sx={{
            fontWeight: 500,
            fontSize: 11,
            mt: 0.3,
            color: getColor('publish')
          }}
        >
          {t('bottombar.publish')}
        </Typography>
      </Box>

      {/* Cart */}
      <BottomBarItem
        icon={
          <img
            src='/forklift.svg'
            alt='Forklift'
            style={{
              width: 24,
              height: 24,
              filter: getFilter('cart'),
              transition: 'filter 0.3s ease'
            }}
          />
        }
        label={t('bottombar.cart')}
        onClick={onCartClick}
        isActive={isActive('cart')}
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
        isActive={isActive('inventory')}
      />
    </Box>
  )
}

// 子组件 BottomBarItem
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
      '&:hover': {
        backgroundColor: '#f3f4f6'
      }
    }}
  >
    {icon}
    <Typography
      sx={{
        fontWeight: 500,
        fontSize: 11,
        mt: 0.3,
        color: isActive ? '#2563eb' : '#9ca3af',
        transition: 'color 0.3s ease'
      }}
    >
      {label}
    </Typography>
  </Box>
)

export default WokerBottomBar
