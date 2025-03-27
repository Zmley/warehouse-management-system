import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider
} from '@mui/material'
import { usePendingTaskContext } from '../contexts/pendingTask'
import { useNavigate } from 'react-router-dom'
import { acceptTask as acceptTaskAPI } from '../api/taskApi'
import { Task } from '../types/task'

const PendingTaskList: React.FC = () => {
  const { pendingTasks, fetchInProcessTask } = usePendingTaskContext()
  const navigate = useNavigate()

  const acceptTask = async (task: Task) => {
    try {
      const res = await acceptTaskAPI(task.taskID)

      if (res?.task) {
        await fetchInProcessTask()
        navigate('/task-detail')
      } else {
        console.warn('⚠️ Task accept API did not return a task.')
      }
    } catch (error) {
      console.error('❌ Failed to accept task:', error)
    }
  }

  return (
    <Box p={2}>
      {pendingTasks.length === 0 ? (
        <Typography color='text.secondary'>No pending tasks found.</Typography>
      ) : (
        pendingTasks.map(task => (
          <Card
            key={task.taskID}
            variant='outlined'
            sx={{
              mb: 3,
              borderRadius: 4,
              backgroundColor: '#f5faff',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)'
            }}
          >
            <CardContent>
              <Typography fontWeight='bold' fontSize={16} mb={2}>
                Task ID # {task.taskID}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant='caption' color='text.secondary'>
                    Source Bin
                  </Typography>
                  <Typography fontWeight='bold'>
                    {task.sourceBinCode?.join(', ') || '--'}
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant='caption' color='text.secondary'>
                    Product Code
                  </Typography>
                  <Typography fontWeight='bold'>{task.productCode}</Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant='caption' color='text.secondary'>
                    Target Bin
                  </Typography>
                  <Typography fontWeight='bold'>
                    {task.destinationBinCode?.join(', ') || '--'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
              >
                <Typography variant='caption' color='text.secondary'>
                  Create Date: {new Date(task.createdAt).toLocaleString()}
                </Typography>

                <Button
                  variant='contained'
                  onClick={() => acceptTask(task)}
                  sx={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.8,
                    textTransform: 'uppercase',
                    borderRadius: 1.5,
                    fontSize: 11,
                    minWidth: '72px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    '&:hover': {
                      backgroundColor: '#1e50c2'
                    }
                  }}
                >
                  Accept
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}

export default PendingTaskList
