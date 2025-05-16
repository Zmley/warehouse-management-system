import { Box, Typography, Button, Grid, Card } from '@mui/material'
import { QrCode } from 'lucide-react'
import { useTaskContext } from 'contexts/task'
import { useNavigate } from 'react-router-dom'
import { useTask } from 'hooks/useTask'
import { useEffect } from 'react'

const TaskDetail: React.FC = () => {
  const navigate = useNavigate()
  const { myTask, fetchMyTask } = useTaskContext()
  const { cancelMyTask } = useTask()

  useEffect(() => {
    fetchMyTask()
  }, [])
  if (!myTask) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
      >
        <Typography variant='h6' color='error'>
          loading
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      height='100vh'
      sx={{ background: 'linear-gradient(to bottom right, #ffffff, #e3f2fd)' }}
    >
      <Card
        sx={{
          width: 330,
          p: 2,
          borderRadius: 3,
          backgroundColor: '#f1f6fa',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Typography fontWeight='bold' fontSize={14} mb={2}>
          Task ID # {myTask.taskID}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Typography variant='caption'>Source Bin</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {myTask.sourceBins?.length
                ? myTask.sourceBins
                    .map((sourceBin: any) => sourceBin.bin?.binCode || '--')
                    .join(' / ')
                : '--'}
            </Typography>
          </Grid>

          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography variant='caption'>Product Code</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {myTask.productCode || '--'}
            </Typography>
          </Grid>

          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography variant='caption'>Quantity</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {myTask.quantity ?? '--'}
            </Typography>
          </Grid>

          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Typography variant='caption'>Target Bin</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {myTask.destinationBinCode || '--'}
            </Typography>
          </Grid>
        </Grid>

        <Button
          variant='contained'
          fullWidth
          onClick={() => navigate('/my-task/scan-qr')}
          sx={{
            py: 2,
            backgroundColor: '#2563eb',
            borderRadius: 4,
            fontSize: 24,
            boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
          }}
        >
          <QrCode size={32} color='white' />
        </Button>

        <Button
          variant='outlined'
          color='error'
          fullWidth
          sx={{ mt: 2, borderRadius: 3, textTransform: 'none' }}
          onClick={async () => {
            if (myTask?.taskID) {
              try {
                await cancelMyTask(myTask.taskID)
                navigate('/')
              } catch (err) {}
            }
          }}
        >
          Cancel ❌
        </Button>

        <Typography
          variant='caption'
          color='text.secondary'
          mt={2}
          display='block'
          textAlign='center'
        >
          Create Date {new Date(myTask.createdAt).toLocaleString()}
        </Typography>
      </Card>
    </Box>
  )
}

export default TaskDetail
