import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Grid, Card, Chip } from '@mui/material'
import { QrCode } from 'lucide-react'
import { usePendingTaskContext } from '../../contexts/pendingTask'
import { useTask } from '../../hooks/useTask'

const TaskDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { inProcessTask, fetchInProcessTask } = usePendingTaskContext()
  const [loading, setLoading] = useState(true)
  const { cancelCurrentTask } = useTask()

  const [task, setTask] = useState(inProcessTask)

  useEffect(() => {
    const loadTask = async () => {
      if (!inProcessTask) {
        const latestTask = await fetchInProcessTask()
        setTask(latestTask)
      } else {
        setTask(inProcessTask)
      }
      setLoading(false)
    }

    loadTask()
  }, [])

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
      >
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  if (!task) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
      >
        <Typography variant='h6' color='error'>
          Task not found
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
          Task ID # {task.taskID}
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
              {task.sourceBinCode?.join('/')}
            </Typography>
          </Grid>
          <Grid item />
          <Grid item>
            <Typography variant='caption'>Target Bin</Typography>
            <Typography fontWeight='bold' fontSize={20}>
              {task.destinationBinCode?.join('/')}
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
          onClick={() => navigate('/scan-qr')}
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
            if (task?.taskID) {
              try {
                await cancelCurrentTask(task.taskID)
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
          Create Date {new Date(task.createdAt).toLocaleString()}
        </Typography>
      </Card>
    </Box>
  )
}

export default TaskDetailPage
