import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider
} from '@mui/material'
import { useTaskContext } from 'contexts/task'
import { useAutoRefresh, useTask } from 'hooks/useTask'
import { Task } from 'types/task'

const TaskList: React.FC = () => {
  const { tasks, fetchTasks } = useTaskContext()
  const { acceptTask } = useTask()

  const [loadingTasks, setLoadingTasks] = useState<{
    [taskID: string]: boolean
  }>({})

  const handleAccept = async (taskID: string) => {
    setLoadingTasks(prev => ({ ...prev, [taskID]: true }))
    try {
      await acceptTask(taskID)
      await fetchTasks()
    } catch (error) {
      console.error('Error accepting task:', error)
    } finally {
      setLoadingTasks(prev => ({ ...prev, [taskID]: false }))
    }
  }

  useAutoRefresh(fetchTasks)

  return (
    <Box p={2}>
      {tasks.length === 0 ? (
        <Typography color='text.secondary'>No pending tasks found.</Typography>
      ) : (
        tasks.map((task: Task) => (
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
              <Grid container spacing={2}>
                <Grid item xs={12} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Source Bin
                  </Typography>
                  <Box
                    sx={{
                      fontWeight: 'bold',
                      fontSize: 16,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                      mt: 0.5
                    }}
                  >
                    {task.sourceBins?.length
                      ? task.sourceBins
                          .map((item: any) => item.bin?.binCode || '--')
                          .join(' / ')
                      : '--'}
                  </Box>
                </Grid>

                <Grid item xs={4} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Product
                  </Typography>
                  <Typography fontWeight='bold'>{task.productCode}</Typography>
                </Grid>

                <Grid item xs={4} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Quantity
                  </Typography>
                  <Typography fontWeight='bold'>
                    {task.quantity || '--'}
                  </Typography>
                </Grid>

                <Grid item xs={4} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Target Bin
                  </Typography>
                  <Typography fontWeight='bold'>
                    {task.destinationBinCode || '--'}
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
                  onClick={() => handleAccept(task.taskID)}
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
                  disabled={loadingTasks[task.taskID]}
                >
                  {loadingTasks[task.taskID] ? 'Loading...' : 'Accept'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}

export default TaskList
