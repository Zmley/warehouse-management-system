// src/pages/Picker/PickerBinScanPage.tsx

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Button, Box } from '@mui/material'
import usePickBinScanner from '../../hooks/usePickBinScanner'
import { getBinByBinCode } from '../../api/binApi'

const PickerBinScanPage = () => {
  const navigate = useNavigate()

  const handleBinScanned = async (binCode: string) => {
    console.log('📦 Bin Scanned:', binCode)

    try {
      const bin = await getBinByBinCode(binCode)

      navigate('/create-task', { state: { bin } })
    } catch (err) {
      console.error('❌ Failed to fetch bin info:', err)
      alert('❌ Bin not found or error occurred')
    }
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
      .catch(() => {
        alert('Please enable camera permissions to use scanning.')
      })

    return () => {
      stopScanning()
      streamRef.current?.getTracks().forEach(track => track.stop())
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
