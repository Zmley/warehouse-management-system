import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Button, Box } from '@mui/material'
import usePickBinScanner from '../../hooks/usePickBinScanner'

const PickerBinScanPage = () => {
  const navigate = useNavigate()

  const handleBinScanned = (binCode: string) => {
    console.log('✅ Bin Scanned:', binCode)
    navigate('/create-task', { state: { binCode } })
  }

  const { videoRef, startScanning, stopScanning } =
    usePickBinScanner(handleBinScanned)

  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(s => {
        streamRef.current = s
        startScanning()
      })
      .catch(err => {
        alert('Please enable camera permissions to use scanning.')
      })

    return () => {
      stopScanning()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <Container maxWidth='sm' sx={{ textAlign: 'center', padding: '20px' }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          height: '250px',
          borderRadius: '10px',
          border: '2px solid #1976d2',
          overflow: 'hidden',
          mx: 'auto'
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          playsInline
        />
      </Box>

      <Typography variant='body2' mt={2}>
        Scan a bin to create a task
      </Typography>

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ mt: 3 }}
        onClick={() => {
          stopScanning()
          navigate('/')
        }}
      >
        ❌ Cancel
      </Button>
    </Container>
  )
}

export default PickerBinScanPage
