import React, { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { useAuth } from 'hooks/useAuth'

const Login: React.FC = () => {
  const { handleLogin, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [domain, setDomain] = useState('@outlook.com')

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    const savedPassword = localStorage.getItem('savedPassword')
    if (savedEmail && savedPassword) {
      const parts = savedEmail.split('@')
      setUsername(parts[0])
      setDomain(`@${parts[1]}`)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleLoginClick = () => {
    const email = `${username}${domain}`

    if (rememberMe) {
      localStorage.setItem('savedEmail', email)
      localStorage.setItem('savedPassword', password)
    } else {
      localStorage.removeItem('savedEmail')
      localStorage.removeItem('savedPassword')
    }

    handleLogin(email, password)
  }

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
          background: '#FFF',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 4px 10px #0000001A'
        }}
      >
        <Typography
          variant='h5'
          sx={{ fontWeight: 'bold', mb: 2, color: '#2272FF' }}
        >
          Welcome to
        </Typography>
        <Typography
          variant='h5'
          sx={{ fontWeight: 'bold', mb: 3, color: '#2272FF' }}
        >
          Inventory System!
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}
        >
          <TextField
            label='Username'
            variant='outlined'
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <Typography
            sx={{
              minWidth: '120px',
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#555'
            }}
          >
            {domain}
          </Typography>
        </Box>

        <TextField
          label='Password'
          variant='outlined'
          fullWidth
          type='password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              color='primary'
            />
          }
          label='Remember me'
          sx={{ mb: 2 }}
        />

        <Button
          variant='contained'
          fullWidth
          sx={{
            backgroundColor: '#2272FF',
            color: '#FFF',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#1A5BCC' }
          }}
          onClick={handleLoginClick}
        >
          Login
        </Button>

        <Typography sx={{ color: '#555', fontSize: '14px', mt: 2 }}>
          Forgot password?
        </Typography>
      </Box>
    </Box>
  )
}

export default Login
