// 📁 src/pages/common/TaskSuccessPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Snackbar, Alert, Box, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useBinCodeContext } from '../../contexts/binCode'
import { useAuth } from '../../hooks/useAuth'

const TaskSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(true)
  const { setDestinationBinCode } = useBinCodeContext()
  const { userProfile } = useAuth()

  const role = userProfile?.role

  useEffect(() => {
    setDestinationBinCode(null)

    const timer = setTimeout(() => {
      setOpen(false)
      navigate('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate, setDestinationBinCode])

  const getMessageByRole = () => {
    if (role === 'PICKER') return '✅ Task has been created'
    if (role === 'TRANSPORT_WORKER') return '✅ Offload succeeded'
    return '✅ Success'
  }

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
        onClose={() => setOpen(false)}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity='success'
          sx={{
            width: 'auto',
            borderRadius: 3,
            backgroundColor: '#f0f6fb',
            textAlign: 'center',
            padding: '10px 20px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 4
          }}
        >
          <CheckCircleIcon
            sx={{ fontSize: 20, marginRight: 1, color: '#2f7abf' }}
          />
          <Typography variant='body1'>{getMessageByRole()}</Typography>
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TaskSuccessPage
