import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Fade
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { AuthContext } from '../contexts/auth'

const TaskSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const { userProfile } = useContext(AuthContext)!
  const [visible, setVisible] = useState(true)

  const role = userProfile?.role

  const handleClose = () => {
    setVisible(false)
    window.location.href = '/'
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Fade in={visible}>
      <Box
        sx={{
          height: '100vh',
          background: 'linear-gradient(to bottom right, #e3f2fd, #ffffff)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}
      >
        <Card
          elevation={8}
          sx={{
            borderRadius: 4,
            padding: 4,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <CardContent>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#2e7d32', mb: 2 }} />
            <Typography variant='h5' fontWeight='bold' gutterBottom>
              {role === 'PICKER'
                ? 'Pick-up Task Created!'
                : 'Offload Completed!'}
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
              Everything went smoothly. You’ll be redirected shortly.
            </Typography>
            <CircularProgress
              size={24}
              thickness={4}
              sx={{ color: '#2e7d32', mt: 2 }}
            />
          </CardContent>
        </Card>
      </Box>
    </Fade>
  )
}

export default TaskSuccessPage
