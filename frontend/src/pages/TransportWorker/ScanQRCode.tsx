import { Container, Typography, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import useQRScanner from '../../hooks/useQRScanner'
import { useEffect, useRef, useState } from 'react'

const ScanTaskPage = () => {
  const navigate = useNavigate()
  const stopButtonRef = useRef<HTMLButtonElement>(null)

  const handleScanSuccess = async (binCode: string) => {
    console.log(`Scanned bin code: ${binCode}`)
  }

  const { videoRef, startScanning } = useQRScanner(handleScanSuccess)

  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!hasStarted) {
      startScanning()
      setHasStarted(true)
    }
  }, [hasStarted, startScanning])

  return (
    <Container
      maxWidth='sm'
      sx={{
        textAlign: 'center',
        padding: '20px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5', // Light background color
        borderRadius: '15px', // Rounded container for a modern feel
        boxShadow: 3 // Adding shadow for depth
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          height: '250px',
          borderRadius: '12px', // Rounded corners for the video container
          overflow: 'hidden',
          mx: 'auto',
          border: '5px solid #1976d2' // Bold border color for contrast
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px' // Match video container border radius
          }}
          autoPlay
          playsInline
        />
      </Box>

      <Typography
        variant='h5'
        sx={{
          marginTop: 3,
          fontWeight: 'bold',
          color: '#333' // Dark text for better readability
        }}
      >
        Scan the QR code to process the task
      </Typography>

      <Typography
        variant='body1'
        sx={{
          marginTop: 2,
          fontSize: '14px',
          color: '#777' // Lighter gray color for secondary text
        }}
      >
        Please scan the QR code to continue.
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Button
          variant='contained'
          color='error'
          fullWidth
          sx={{
            fontSize: '16px',
            borderRadius: '12px',
            py: 1.5,
            '&:hover': {
              backgroundColor: '#d32f2f' // Darker red on hover for the cancel button
            }
          }}
          onClick={() => {
            stopButtonRef.current?.click()
            window.location.href = '/' // Navigate to home or another page when canceled
          }}
        >
          ❌ Cancel
        </Button>
      </Box>
    </Container>
  )
}

export default ScanTaskPage
