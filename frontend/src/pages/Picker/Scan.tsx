import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Button, Box, Paper } from '@mui/material'
import useQRScanner from 'hooks/useQRScanner'
import { getBinByBinCode } from 'api/binApi'

const isAndroid = /Android/i.test(navigator.userAgent)

const Scan = () => {
  const navigate = useNavigate()
  const [hasStarted, setHasStarted] = useState(false)

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
    useQRScanner(handleBinScanned)

  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isAndroid) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(s => {
          streamRef.current = s
          startScanning()
          setHasStarted(true)
        })
        .catch(() => {
          alert('Please enable camera permissions to use scanning.')
        })
    }

    return () => {
      stopScanning()
      const currentStream = streamRef.current
      currentStream?.getTracks().forEach(track => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAndroidStart = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = s
      await startScanning()
      setHasStarted(true)
    } catch {
      alert('❌ Failed to access camera on Android. Please check permission.')
    }
  }

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
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
          autoPlay
          playsInline
          muted
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

      {isAndroid && !hasStarted && (
        <Button
          variant='outlined'
          sx={{ mt: 3, maxWidth: 400 }}
          fullWidth
          onClick={handleAndroidStart}
        >
          👉 Android: Tap to Enable Camera
        </Button>
      )}

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ maxWidth: 400, mt: 3 }}
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
