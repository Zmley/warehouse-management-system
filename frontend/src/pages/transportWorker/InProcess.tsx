import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Box,
  Card,
  CardContent
} from '@mui/material'
import useQRScanner from '../../hooks/useQRScanner'
import { useTransportContext } from '../../context/transportTaskContext'
import { processBinTask } from '../../api/transportTaskApi'

const InProcessTaskPage = () => {
  const navigate = useNavigate()
  const { videoRef, isScanning, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)
  const [isLoading, setIsLoading] = useState(false)

  const { transportStatus, taskData, fetchTaskStatus } = useTransportContext()

  useEffect(() => {
    console.log('Fetching task status on mount...')
    fetchTaskStatus()

    return () => {
      console.log('Cleaning up task status effect...')
    }
  }, [])

  async function handleScanSuccess(binID: string) {
    console.log(`✅ Scanned bin: ${binID}`)
    stopScanning()
    setIsLoading(true)

    try {
      const response = await processBinTask(binID, false)
      if (response.success) {
        await fetchTaskStatus()
        window.location.reload()
      }
    } catch (error) {
      console.error('❌ Failed to unload cargo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!taskData.taskID) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: '50px' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth='sm' sx={{ textAlign: 'center', padding: '20px' }}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        📦 Task Detail
      </Typography>

      <Card
        variant='outlined'
        sx={{ bgcolor: '#f5f5f5', borderRadius: '12px', padding: 2 }}
      >
        <CardContent>
          <Typography
            variant='subtitle2'
            sx={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}
          >
            Task ID: {taskData.taskID}
          </Typography>

          {/* Source Bin & Target Bin */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ fontSize: '14px', fontWeight: 'bold' }}
              >
                Source Bin
              </Typography>
              <Typography
                variant='body1'
                sx={{ fontSize: '16px', fontWeight: 'bold' }}
              >
                {taskData.binCode || '--'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant='subtitle2'
                sx={{ fontSize: '14px', fontWeight: 'bold' }}
              >
                Target Bin
              </Typography>
              <Typography
                variant='body1'
                sx={{ fontSize: '16px', fontWeight: 'bold' }}
              >
                {taskData.targetCode || '--'}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 2
            }}
          >
            <Box
              sx={{
                bgcolor:
                  transportStatus === 'inProgress' ? '#A5D6A7' : '#BDBDBD',
                color: 'black',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>●</span>{' '}
              {transportStatus === 'inProgress'
                ? 'Goods Picked'
                : 'Goods Delivered'}
            </Box>
          </Box>

          {transportStatus === 'completed' && (
            <Typography
              variant='h6'
              sx={{ color: '#2e7d32', fontWeight: 'bold', mt: 2 }}
            >
              ✅ Task Completed!
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              sx={{ borderRadius: '10px', fontSize: '14px' }}
              onClick={startScanning}
              disabled={isScanning || transportStatus === 'completed'} // ✅ 任务完成后禁用按钮
            >
              {isScanning ? 'Scanning...' : 'SCAN 📷'}
            </Button>

            <Button
              variant='contained'
              color='error'
              fullWidth
              sx={{
                borderRadius: '10px',
                mt: 1,
                fontSize: '14px',
                bgcolor: '#D32F2F',
                color: 'white'
              }}
              onClick={stopScanning}
              disabled={!isScanning}
            >
              CANCEL ❌
            </Button>
          </Box>

          {isScanning && (
            <Box
              sx={{
                width: '100%',
                maxWidth: '400px',
                height: '250px',
                borderRadius: '10px',
                border: '2px solid #1976d2',
                overflow: 'hidden',
                mx: 'auto',
                mt: 2
              }}
            >
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%' }}
                autoPlay
                playsInline
              />
            </Box>
          )}

          {isLoading && <CircularProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* ✅ 返回 Dashboard 按钮 */}
      <Button
        variant='outlined'
        color='secondary'
        fullWidth
        sx={{
          borderRadius: '10px',
          mt: 2,
          fontSize: '14px',
          fontWeight: 'bold'
        }}
        onClick={() => navigate('/dashboard')}
      >
        🔙 Back to Dashboard
      </Button>
    </Container>
  )
}

export default InProcessTaskPage
