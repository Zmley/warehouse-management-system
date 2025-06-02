import React from 'react'
import { Box, Typography } from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import { useTranslation } from 'react-i18next'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
}

const BottomBar: React.FC<BottomBarProps> = ({
  onCartClick,
  onTaskListClick
}) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: '#ffffff',
        boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        zIndex: 1200
      }}
    >
      {/* Task Button */}
      <Box
        onClick={onTaskListClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#ecfdf5'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: '#10b981',
            borderRadius: '50%',
            padding: 1.2,
            mb: 0.5,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AssignmentOutlinedIcon sx={{ color: '#ffffff', fontSize: 20 }} />
        </Box>
        <Typography
          variant='caption'
          sx={{ fontWeight: 600, fontSize: 12, color: '#10b981' }}
        >
          {t('bottombar.tasks')}
        </Typography>
      </Box>

      {/* Cart Button */}
      <Box
        onClick={onCartClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#e0edff'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: '#2563eb',
            borderRadius: '50%',
            padding: 1.2,
            mb: 0.5,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Inventory2OutlinedIcon sx={{ color: '#ffffff', fontSize: 20 }} />
        </Box>
        <Typography
          variant='caption'
          sx={{ fontWeight: 600, fontSize: 12, color: '#2563eb' }}
        >
          {t('bottombar.cart')}
        </Typography>
      </Box>
    </Box>
  )
}

export default BottomBar
