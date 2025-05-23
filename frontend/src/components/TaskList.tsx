import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import { useTask } from 'hooks/useTask'
import { Task } from 'types/task'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { useTaskContext } from 'contexts/task'

interface TaskListProps {
  setView: (view: 'task' | 'cart') => void
}

const TaskList: React.FC<TaskListProps> = ({ setView }) => {
  const { tasks, fetchTasks, acceptTask, isLoading, error } = useTask()
  const { fetchMyTask } = useTaskContext()

  const [loadingTasks, setLoadingTasks] = useState<{
    [taskID: string]: boolean
  }>({})

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (error) setOpen(true)
  }, [error])

  useEffect(() => {
    fetchTasks()
    fetchMyTask()
  }, [])

  const handleAccept = async (taskID: string) => {
    setLoadingTasks(prev => ({ ...prev, [taskID]: true }))
    try {
      await acceptTask(taskID)
      await fetchMyTask()
      await fetchTasks()
      setView('cart')
    } catch (err) {
      console.error('Error accepting task:', err)
    } finally {
      setLoadingTasks(prev => ({ ...prev, [taskID]: false }))
    }
  }

  const handleManualRefresh = async () => {
    await fetchTasks()
    await fetchMyTask()
  }

  return (
    <PullToRefresh onRefresh={handleManualRefresh}>
      <Box p={2} pb={10}>
        {isLoading ? (
          <Box display='flex' justifyContent='center' mt={4}>
            <CircularProgress size={30} thickness={5} />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography color='text.secondary' textAlign='center'>
            No pending tasks found.
          </Typography>
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
                        wordBreak: 'break-word',
                        mt: 0.5
                      }}
                    >
                      {task.sourceBins?.length > 0
                        ? task.sourceBins
                            .map((inv: any) => inv.bin?.binCode)
                            .filter(Boolean)
                            .join(' / ')
                        : '--'}
                    </Box>
                  </Grid>

                  <Grid item xs={4} textAlign='center'>
                    <Typography variant='caption' color='text.secondary'>
                      Product
                    </Typography>
                    <Typography fontWeight='bold'>
                      {task.productCode}
                    </Typography>
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
                    disabled={loadingTasks[task.taskID]}
                    sx={{
                      backgroundColor: '#2563eb',
                      fontSize: 11,
                      px: 2,
                      py: 0.8,
                      borderRadius: 1.5,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#1e50c2'
                      }
                    }}
                  >
                    {loadingTasks[task.taskID] ? 'Loading...' : 'Accept'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity='error'
          variant='filled'
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </PullToRefresh>
  )
}

export default TaskList
