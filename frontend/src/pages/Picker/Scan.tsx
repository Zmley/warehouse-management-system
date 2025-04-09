import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Button, Box, Paper } from '@mui/material'
import useQRScanner from '../../hooks/useQRScanner'
import { getBinByBinCode } from '../../api/binApi'
import { usePickerTasks } from '../../hooks/usePickerTask'

const Scan = () => {
  const navigate = useNavigate()
  const { error, setError } = usePickerTasks()

  const handleBinScanned = async (binCode: string) => {
    console.log('📦 Bin Scanned:', binCode)
    setError(null)

    try {
      const bin = await getBinByBinCode(binCode)
      navigate('/create-task', { state: { bin } })
    } catch (err: any) {
      console.error('❌ Failed to fetch bin info:', err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        '❌ Failed to fetch bin info.'
      setError(message)
    }
  }

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleBinScanned)

  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(s => {
        streamRef.current = s
        startScanning()
      })
      .catch(() => {
        setError('Please enable camera permissions to use scanning.')
      })

    return () => {
      stopScanning()
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Typography variant='h5' fontWeight='bold' mb={3}>
        Scan a Bin to Create a Task
      </Typography>

      <Paper
        elevation={4}
        sx={{
          width: '90%',
          maxWidth: 400,
          height: 280,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          border: '3px solid #1976d2',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          autoPlay
          playsInline
        />
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            border: '2px dashed #ffffffaa',
            borderRadius: '12px',
            zIndex: 10
          }}
        />
      </Paper>

      {error && (
        <Typography
          variant='body2'
          sx={{ mt: 2, color: 'error.main', fontWeight: 600 }}
        >
          {error}
        </Typography>
      )}

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ maxWidth: 400, mt: 4 }}
        onClick={() => {
          stopScanning()
          navigate('/')
        }}
      >
        ❌ Cancel
      </Button>
    </Box>
  )
}

export default Scan
