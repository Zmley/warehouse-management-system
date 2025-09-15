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

const TOGGLE_GROUP_SX = {
  mb: 1.25,
  display: 'flex',

  gap: 1,

  '& .MuiToggleButton-root': {
    flex: 1,
    textTransform: 'none',
    fontSize: '0.8rem',
    px: 1,
    py: 0.5,
    fontWeight: 600,
    borderColor: '#e6ebf2',
    color: '#64748b',
    backgroundColor: '#f9fafb',
    '&:hover': {
      backgroundColor: '#f1f5f9'
    }
  },
  '& .MuiToggleButton-root.Mui-selected': {
    color: '#2563eb',
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    '&:hover': {
      backgroundColor: 'rgba(37, 99, 235, 0.2)'
    }
  }
} as const

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const { userProfile, handleLogout } = useAuth()
  const { t, i18n } = useTranslation()

  const getInitialMode = (): Mode => {
    const saved = (localStorage.getItem('scanMode') as Mode | null) || null
    if (saved === 'camera' || saved === 'gun') return saved
    localStorage.setItem('scanMode', 'camera')
    return 'camera'
  }
  const initialMode = useMemo<Mode>(getInitialMode, [])
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

  const rawRole = userProfile?.role || ''
  const roleLabel =
    (rawRole && t(`profile.roles.${rawRole}`, { defaultValue: rawRole })) ||
    t('profile.noRole', 'N/A')

  return (
    <Drawer anchor='left' open={open} onClose={onClose}>
      <Box
        sx={{
          width: 300,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
        role='presentation'
      >
        {/* Header */}
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
            {t('profile.title')}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label={t('common.close')}
            sx={{ position: 'absolute', right: 8, top: 6 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Body */}
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
            {t('profile.role')}
          </Typography>
          <Typography sx={{ mb: 1 }}>{roleLabel}</Typography>

          <Divider sx={{ my: 1 }} />

          <Typography fontSize={13} fontWeight='bold' sx={{ mb: 0.5 }}>
            {t('profile.language')}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={langValue}
            onChange={handleLangChange}
            fullWidth
            size='small'
            aria-label={t('profile.language')}
            sx={TOGGLE_GROUP_SX}
          >
            <ToggleButton value='zh' aria-label={t('profile.lang.zh')}>
              {t('profile.lang.zh')}
            </ToggleButton>
            <ToggleButton value='en' aria-label={t('profile.lang.en')}>
              {t('profile.lang.en')}
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography fontSize={13} fontWeight='bold' sx={{ mb: 0.5 }}>
            {t('profile.defaultScanMode')}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={handleModeChange}
            fullWidth
            size='small'
            aria-label={t('profile.defaultScanMode')}
            sx={TOGGLE_GROUP_SX}
          >
            <ToggleButton value='camera' aria-label={t('scan.camera')}>
              <SmartphoneIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('scan.camera')}
            </ToggleButton>
            <ToggleButton value='gun' aria-label={t('scan.scanner')}>
              <QrCodeScannerIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('scan.scanner')}
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider sx={{ my: 1 }} />

          <Button
            variant='outlined'
            fullWidth
            size='small'
            startIcon={<LogoutIcon />}
            aria-label={t('profile.signOut')}
            onClick={() => {
              handleLogout()
              onClose()
            }}
            sx={{ fontSize: '0.9rem', py: 0.6 }}
          >
            {t('profile.signOut')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ProfileDrawer
