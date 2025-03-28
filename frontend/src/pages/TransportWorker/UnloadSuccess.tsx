import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Paper, Grow } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useBinCodeContext } from '../../contexts/binCode'
import { useAuth } from '../../hooks/useAuth'

const TaskSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const { setDestinationBinCode } = useBinCodeContext()
  const { userProfile } = useAuth()

  const role = userProfile?.role
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setDestinationBinCode(null)
    setChecked(true)

    const timer = setTimeout(() => {
      navigate('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate, setDestinationBinCode])

  const getMessageByRole = () => {
    if (role === 'PICKER') return 'Task has been created!'
    if (role === 'TRANSPORT_WORKER') return 'Offload completed successfully!'
    return 'Operation completed!'
  }

  return (
    <Box
      sx={{
        height: '100vh',
        background: 'linear-gradient(to right, #a1c4fd, #c2e9fb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Grow in={checked} timeout={600}>
        <Paper
          elevation={6}
          sx={{
            padding: '40px 50px',
            borderRadius: '20px',
            textAlign: 'center',
            backgroundColor: 'white',
            boxShadow: '0px 8px 24px rgba(0,0,0,0.1)'
          }}
        >
          <CheckCircleIcon
            sx={{
              fontSize: 60,
              color: '#4caf50',
              mb: 2
            }}
          />
          <Typography variant='h4' fontWeight='bold' color='primary'>
            Success!
          </Typography>
          <Typography variant='body1' mt={2} fontSize={18}>
            {getMessageByRole()}
          </Typography>
        </Paper>
      </Grow>
    </Box>
  )
}

export default TaskSuccessPage
