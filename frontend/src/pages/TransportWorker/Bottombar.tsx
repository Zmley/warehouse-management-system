import React from 'react'
import { Box, Typography } from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
  onPublishClick: () => void
}

const BottomBar: React.FC<BottomBarProps> = ({
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
        height: 86,
        backgroundColor: '#ffffff',
        boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 1200
      }}
    >
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

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: -4,
          pointerEvents: 'auto'
        }}
      >
        <Box
          onClick={onPublishClick}
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: '0 8px 20px rgba(59,130,246,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb, #1e40af)'
            }
          }}
        >
          <AddIcon sx={{ color: '#fff', fontSize: 32 }} />
        </Box>
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
        <Inventory2OutlinedIcon sx={{ fontSize: 24, color: '#2563eb' }} />
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

export default BottomBar
