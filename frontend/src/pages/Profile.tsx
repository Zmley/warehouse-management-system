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

interface ProfileDrawerProps {
  open: boolean
  onClose: () => void
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ open, onClose }) => {
  const { userProfile, handleLogout } = useAuth()

  return (
    <Drawer anchor='left' open={open} onClose={onClose}>
      <Box width={300} p={2} role='presentation'>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h6' fontWeight='bold'>
            Profile
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

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
          Role:
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
          Sign Out
        </Button>
      </Box>
    </Drawer>
  )
}

export default ProfileDrawer
