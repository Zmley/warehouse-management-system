// src/pages/Picker/PickerBinScanPage.tsx

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  useTheme
} from '@mui/material'
import usePickBinScanner from '../../hooks/usePickerScanner'
import { getBinByBinCode } from '../../api/binApi'

const PickerBinScanPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()

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
        {/* 扫描框效果 */}
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

export default PickerBinScanPage
