import React from 'react'
import { Box, Typography, Divider, IconButton } from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
interface BottomBarProps {
  onCreatePickTaskClick: () => void
  onCreateTaskClick: () => void
}

const BottomBar: React.FC<BottomBarProps> = ({
  onCreatePickTaskClick,
  onCreateTaskClick
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        zIndex: 1200
      }}
    >
      {/* 左侧按钮 */}
      <Box
        onClick={onCreatePickTaskClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#2563eb',
          '&:hover': {
            backgroundColor: '#e8f0fe'
          }
        }}
      >
        <IconButton sx={{ color: '#2563eb' }}>
          <QrCodeScannerIcon />
        </IconButton>
        <Typography variant='caption' fontWeight={600}>
          Create Pick Task
        </Typography>
      </Box>

      {/* 分隔线 */}
      <Divider orientation='vertical' flexItem sx={{ borderColor: '#ccc' }} />

      {/* 右侧按钮 */}
      <Box
        onClick={onCreateTaskClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#10b981',
          '&:hover': {
            backgroundColor: '#d1fae5'
          }
        }}
      >
        <IconButton sx={{ color: '#10b981' }}>
          <Inventory2OutlinedIcon />
        </IconButton>
        <Typography variant='caption' fontWeight={600}>
          Load Cargo
        </Typography>
      </Box>
    </Box>
  )
}

export default BottomBar
