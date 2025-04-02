import { Box, Typography, Button, Grid, Card, Chip } from '@mui/material'
import { QrCode } from 'lucide-react'
import { useTaskContext } from '../../contexts/task'
import { useNavigate } from 'react-router-dom'
import { useTask } from '../../hooks/useTask'
import { useEffect } from 'react'

const TaskDetail: React.FC = () => {
  const navigate = useNavigate()
  const { myTask, fetchMyTask } = useTaskContext()
  const { cancelMyTask } = useTask()

  useEffect(() => {
    fetchMyTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <Grid
          container
          alignItems='center'
          justifyContent='space-between'
          mb={2}
        >
          <Grid item>
            <Typography variant='caption'>Source Bin</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {myTask.sourceBins?.length
                ? myTask.sourceBins
                    .map((sourceBin: any) => sourceBin.Bin?.binCode || '--')
                    .join(' / ')
                : '--'}
            </Typography>
          </Grid>
          <Grid item />
          <Grid item>
            <Typography variant='caption'>Target Bin</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {myTask.destinationBinCode}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={1} mb={3}>
          <Grid item>
            <Chip
              label='Task Picked'
              color='success'
              sx={{ borderRadius: 2, px: 1.5 }}
              icon={
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: 'green',
                    borderRadius: '50%'
                  }}
                />
              }
            />
          </Grid>
          <Grid item>
            <Chip
              label='Task Delivered'
              sx={{ backgroundColor: '#e0e0e0', borderRadius: 2, px: 1.5 }}
              icon={
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: '#555',
                    borderRadius: '50%'
                  }}
                />
              }
            />
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
