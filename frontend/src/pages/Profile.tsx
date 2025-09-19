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
import LanguageIcon from '@mui/icons-material/Language'
import TranslateIcon from '@mui/icons-material/Translate'
import { useAuth } from 'hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { DeviceType } from 'constants/index'

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
    '&:hover': { backgroundColor: '#f1f5f9' }
  },
  '& .MuiToggleButton-root.Mui-selected': {
    color: '#2563eb',
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.2)' }
  }
} as const

const STORAGE_KEY_DEVICE = 'device'

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const { userProfile, handleLogout } = useAuth()
  const { t, i18n } = useTranslation()

  const getInitialDevice = (): DeviceType => {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICE) as DeviceType | null
    if (raw === DeviceType.PHONE || raw === DeviceType.SCANNER) return raw
    localStorage.setItem(STORAGE_KEY_DEVICE, DeviceType.PHONE)
    return DeviceType.PHONE
  }

  const initialDevice = useMemo<DeviceType>(getInitialDevice, [])
  const [device, setDevice] = useState<DeviceType>(initialDevice)

  const handleDeviceChange = (_: unknown, next: DeviceType | null) => {
    if (!next) return
    setDevice(next)
    localStorage.setItem(STORAGE_KEY_DEVICE, next)
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
              <TranslateIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('profile.lang.zh')}
            </ToggleButton>
            <ToggleButton value='en' aria-label={t('profile.lang.en')}>
              <LanguageIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('profile.lang.en')}
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography fontSize={13} fontWeight='bold' sx={{ mb: 0.5 }}>
            {t('profile.defaultDevice', 'Default Device')}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={device}
            onChange={handleDeviceChange}
            fullWidth
            size='small'
            aria-label={t('profile.defaultDevice')}
            sx={TOGGLE_GROUP_SX}
          >
            <ToggleButton
              value={DeviceType.PHONE}
              aria-label={t('scan.phone', 'Phone')}
            >
              <SmartphoneIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('scan.phone', 'Phone')}
            </ToggleButton>
            <ToggleButton
              value={DeviceType.SCANNER}
              aria-label={t('scan.scanner', 'Scanner')}
            >
              <QrCodeScannerIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {t('scan.scanner', 'Scanner')}
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
