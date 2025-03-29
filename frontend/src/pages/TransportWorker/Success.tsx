import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snackbar, Alert, Box, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useCartContext } from '../../contexts/cart'

const UnloadSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const { setDestinationBinCode } = useCartContext()

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(false)
      navigate('/')
    }, 2000) // Increased time for better UX

    return () => clearTimeout(timer)
  }, [navigate, setDestinationBinCode])

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
        autoHideDuration={2000}
        sx={{
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Alert
          onClose={() => setOpen(false)}
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
            sx={{
              fontSize: 24,
              color: '#1e76a3',
              marginRight: 1
            }}
          />
          <Typography variant='body1' sx={{ fontSize: '16px' }}>
            Offload succeeded
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default UnloadSuccess
