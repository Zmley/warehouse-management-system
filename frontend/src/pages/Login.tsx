import React, { useState } from 'react'
import {
  Typography,
  Button,
  TextField,
  Box,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { useAuth } from '../hooks/useAuth'

const LoginPage: React.FC = () => {
  const { handleLogin } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <Box
      sx={{
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Typography
          variant='h5'
          sx={{ color: '#FFF', fontWeight: 'bold', mb: 2 }}
        >
          LOGO
        </Typography>

        <Typography
          variant='h4'
          sx={{ color: '#FFF', fontWeight: '500', mb: 3 }}
        >
          Sign in
        </Typography>

        <TextField
          label='Login'
          variant='outlined'
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
          sx={{
            mb: 2,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            input: { color: '#FFF' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
              '&:hover fieldset': { borderColor: '#FFF' }
            }
          }}
        />
        <TextField
          label='Password'
          variant='outlined'
          fullWidth
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{
            mb: 2,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            input: { color: '#FFF' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
              '&:hover fieldset': { borderColor: '#FFF' }
            }
          }}
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <FormControlLabel
            control={<Checkbox sx={{ color: '#FFF' }} />}
            label={
              <Typography sx={{ color: '#FFF', fontSize: '14px' }}>
                Remember me
              </Typography>
            }
          />
          <Typography
            sx={{
              color: '#FFF',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Forgot password?
          </Typography>
        </Box>

        <Button
          variant='contained'
          fullWidth
          sx={{
            backgroundColor: '#2272FF',
            color: '#FFF',
            padding: '10px',
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#1A5BCC' }
          }}
          onClick={() => handleLogin(email, password)}
        >
          Login
        </Button>

        <Typography sx={{ color: '#FFF', fontSize: '12px', mt: 3 }}>
          Copyright
        </Typography>
      </Box>
    </Box>
  )
}

export default LoginPage
