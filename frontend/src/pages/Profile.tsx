import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Button
} from '@mui/material'
import { Close as CloseIcon, Logout as LogoutIcon } from '@mui/icons-material'
import { useAuth } from 'hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface ProfileDrawerProps {
  open: boolean
  onClose: () => void
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const { userProfile, handleLogout } = useAuth()
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')
  }

  return (
    <Drawer anchor='left' open={open} onClose={onClose}>
      <Box width={300} p={2} role='presentation'>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h6' fontWeight='bold'>
            {t('profile.title')}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Button
          onClick={toggleLanguage}
          variant='outlined'
          size='small'
          sx={{ mt: 1, mb: 2 }}
        >
          {i18n.language === 'en' ? '中文' : 'English'}
        </Button>

        <Box mt={2} display='flex' alignItems='center'>
          <Avatar src='/profile.jpg' sx={{ width: 60, height: 60, mr: 2 }} />
          <Box>
            <Typography fontWeight='bold'>
              {userProfile?.firstName} {userProfile?.lastName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {userProfile?.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography fontSize={14} fontWeight='bold'>
          {t('profile.role')}:
        </Typography>
        <Typography mb={1}>{userProfile?.role}</Typography>

        <Divider sx={{ my: 2 }} />

        <Button
          variant='outlined'
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={() => {
            handleLogout()
            onClose()
          }}
        >
          {t('profile.signOut')}
        </Button>
      </Box>
    </Drawer>
  )
}

export default ProfileDrawer
