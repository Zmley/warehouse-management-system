import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Button, Box } from '@mui/material'
import useQRScanner from '../../hooks/useQRScanner'

const ScanTaskPage = () => {
  const navigate = useNavigate()
  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  const stopButtonRef = useRef<HTMLButtonElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(s => {
        streamRef.current = s
        console.log('Camera permission granted')
        startScanning()
      })
      .catch(err => {
        console.warn('⚠️ Camera permission denied:', err)
        alert('Please enable camera permissions to use scanning.')
      })

    return () => {
      console.log('🧹 Cleanup triggered')
      stopButtonRef.current?.click()

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log(`🛑 Track ${track.kind} manually stopped`)
        })
        streamRef.current = null
      }
    }
  }, [])

  async function handleScanSuccess(binID: string) {
    console.log(`Scanned new bin ID: ${binID}`)
    setTimeout(() => {
      navigate('/in-process-task')
    })
  }

  return (
    <Container
      maxWidth='sm'
      sx={{
        textAlign: 'center',
        padding: '20px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
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

      <Typography
        variant='body1'
        sx={{ marginTop: 2, fontSize: '14px', color: '#666' }}
      >
        1 Scan the QRcode to process the task
      </Typography>

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ marginTop: 3, fontSize: '14px', borderRadius: '10px' }}
        onClick={() => {
          stopButtonRef.current?.click()
          window.location.href = '/'
        }}
      >
        ❌ Cancel
      </Button>

      <Button
        ref={stopButtonRef}
        onClick={async () => {
          console.log('🎯 Hidden stop button triggered')
          await stopScanning()
        }}
        style={{ display: 'none' }}
      >
        Hidden Stop
      </Button>
    </Container>
  )
}

export default ScanTaskPage
