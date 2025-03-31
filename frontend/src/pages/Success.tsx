import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snackbar, Alert, Box, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { AuthContext } from '../contexts/auth'

const TaskSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const authContext = useContext(AuthContext)

  const role = authContext?.userProfile.role

  const handleClose = () => {
    setOpen(false)
    navigate('/')
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      }}
    >
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={handleClose}
        autoHideDuration={2000}
      >
        <Alert
          onClose={handleClose}
          severity='success'
          sx={{
            width: 'auto',
            borderRadius: 2,
            backgroundColor: '#e7f6fb',
            color: '#1e76a3',
            textAlign: 'center',
            padding: '12px 20px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 5,
            fontSize: '16px',
            gap: 1
          }}
        >
          <CheckCircleIcon
            sx={{ fontSize: 24, color: '#1e76a3', marginRight: 1 }}
          />
          <Typography variant='body1' sx={{ fontSize: '16px' }}>
            {role === 'PICKER'
              ? 'Created Pick up task successfully!'
              : 'Offload succeeded!'}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TaskSuccessPage
