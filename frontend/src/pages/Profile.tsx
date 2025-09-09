import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Stack
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import LogoutIcon from '@mui/icons-material/Logout'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import { useAuth } from 'hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'

type Mode = 'camera' | 'gun'

interface ProfileDrawerProps {
  open: boolean
  onClose: () => void
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const { userProfile, handleLogout } = useAuth()
  const { t, i18n } = useTranslation()

  const initialMode = useMemo<Mode>(() => {
    const saved = (localStorage.getItem('scanMode') || 'gun') as Mode
    return saved === 'camera' ? 'camera' : 'gun'
  }, [])
  const [mode, setMode] = useState<Mode>(initialMode)

  const handleModeChange = (_: unknown, next: Mode | null) => {
    if (!next) return
    setMode(next)
    localStorage.setItem('scanMode', next)
  }

  const langValue: 'zh' | 'en' = i18n.language === 'zh' ? 'zh' : 'en'
  const handleLangChange = (_: unknown, next: 'zh' | 'en' | null) => {
    if (!next) return
    i18n.changeLanguage(next)
  }

  return (
    <Drawer anchor='left' open={open} onClose={onClose}>
      <Box
        sx={{
          width: 280,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
        role='presentation'
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            px: 2,
            py: 1,
            borderBottom: '1px solid #eef0f3',
            bgcolor: '#fff'
          }}
        >
          <Typography variant='h6' fontWeight='bold'>
            {t('profile.title', 'Profile')}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            sx={{ position: 'absolute', right: 8, top: 6 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, overflowY: 'auto' }}>
          <Stack direction='row' alignItems='center' spacing={2} sx={{ mb: 2 }}>
            <Avatar src='/profile.jpg' sx={{ width: 50, height: 50 }} />
            <Box>
              <Typography fontWeight='bold' sx={{ lineHeight: 1.2 }}>
                {userProfile?.firstName} {userProfile?.lastName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {userProfile?.email}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Typography fontSize={13} fontWeight='bold' sx={{ mb: 0.25 }}>
            {t('profile.role', 'Role')}:
          </Typography>
          <Typography sx={{ mb: 1 }}>{userProfile?.role}</Typography>

          <Divider sx={{ my: 1 }} />

          <Typography fontSize={13} fontWeight='bold' sx={{ mb: 0.5 }}>
            {t('profile.language', 'Language')}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={langValue}
            onChange={handleLangChange}
            fullWidth
            size='small'
            sx={{
              mb: 1.25,
              '& .MuiToggleButton-root': {
                flex: 1,
                textTransform: 'none',
                fontSize: '0.8rem',
                px: 1,
                py: 0.5,
                fontWeight: 600,
                borderColor: '#e6ebf2'
              }
            }}
          >
            <ToggleButton value='zh'>中文</ToggleButton>
            <ToggleButton value='en'>English</ToggleButton>
          </ToggleButtonGroup>

          <Typography fontSize={13} fontWeight='bold' sx={{ mb: 0.5 }}>
            {t('profile.defaultScanMode', 'Default Scan Mode')}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={handleModeChange}
            fullWidth
            color='primary'
            size='small'
            sx={{
              mb: 1.25,
              '& .MuiToggleButton-root': {
                flex: 1,
                textTransform: 'none',
                fontSize: '0.8rem',
                px: 1,
                py: 0.5,
                fontWeight: 600,
                borderColor: '#e6ebf2'
              }
            }}
          >
            <ToggleButton value='camera' aria-label='camera'>
              <SmartphoneIcon sx={{ mr: 0.5, fontSize: 18 }} />
              {t('scan.camera')}
            </ToggleButton>
            <ToggleButton value='gun' aria-label='gun'>
              <QrCodeScannerIcon sx={{ mr: 0.5, fontSize: 18 }} />
              {t('scan.scanner')}
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider sx={{ my: 1 }} />

          {/* 退出登录 */}
          <Button
            variant='outlined'
            fullWidth
            size='small'
            startIcon={<LogoutIcon />}
            onClick={() => {
              handleLogout()
              onClose()
            }}
            sx={{ fontSize: '0.85rem', py: 0.5 }}
          >
            {t('profile.signOut', 'Sign out')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ProfileDrawer
