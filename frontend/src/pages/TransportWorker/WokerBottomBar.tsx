import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
  onPublishClick: () => void
}

const WokerBottomBar: React.FC<BottomBarProps> = ({
  onCartClick,
  onTaskListClick,
  onPublishClick
}) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 75,
        backgroundColor: '#ffffff',
        boxShadow: '0px -2px 10px #00000014',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 1200
      }}
    >
      {/* Task List */}
      <Box
        onClick={onTaskListClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          height: '100%',
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#ecfdf5'
          },
          '&:hover svg': { color: '#059669' },
          '&:hover span': { color: '#059669' }
        }}
      >
        <AssignmentOutlinedIcon sx={{ fontSize: 24, color: '#10b981' }} />
        <Typography
          variant='caption'
          sx={{ fontWeight: 600, fontSize: 12, color: '#10b981', mt: 0.5 }}
        >
          {t('bottombar.tasks')}
        </Typography>
      </Box>

      {/* Publish Button (plus icon moved inside) */}
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
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 4px 12px #3B82F657',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb, #1e40af)'
            }
          }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography
          variant='caption'
          sx={{
            fontWeight: 600,
            fontSize: 12,
            mt: 0.5,
            color: '#2563eb'
          }}
        >
          {t('bottombar.publish')}
        </Typography>
      </Box>

      {/* Cart */}
      <Box
        onClick={onCartClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          height: '100%',
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#e0edff'
          },
          '&:hover svg': { color: '#1d4ed8' },
          '&:hover span': { color: '#1d4ed8' }
        }}
      >
        <img
          src='/forklift.svg'
          alt='Forklift'
          style={{
            width: 32,
            height: 32,
            filter:
              'invert(29%) sepia(92%) saturate(1675%) hue-rotate(211deg) brightness(93%) contrast(101%)'
          }}
        />

        <Typography
          variant='caption'
          sx={{ fontWeight: 600, fontSize: 12, color: '#2563eb', mt: 0.5 }}
        >
          {t('bottombar.cart')}
        </Typography>
      </Box>
    </Box>
  )
}

export default WokerBottomBar
