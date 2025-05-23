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
import { useNavigate } from 'react-router-dom'
import { QrCode } from 'lucide-react'

const TaskList: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, fetchTasks, acceptTask, cancelMyTask, isLoading, error } =
    useTask()
  const { myTask, setMyTask, fetchMyTask } = useTaskContext()

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
    } catch (error) {
      console.error('Error accepting task:', error)
    } finally {
      setLoadingTasks(prev => ({ ...prev, [taskID]: false }))
    }
  }

  const handleCancel = async () => {
    if (!myTask) return
    try {
      await cancelMyTask(myTask.taskID)
      setMyTask(null)
      await fetchTasks()
    } catch (err) {
      console.error('❌ Failed to cancel task', err)
    }
  }

  const handleManualRefresh = async () => {
    await fetchTasks()
    await fetchMyTask()
  }

  return (
    <PullToRefresh onRefresh={handleManualRefresh}>
      <Box p={2} pb={10}>
        {myTask && (
          <Card
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
                    <Box
                      sx={{
                        fontWeight: 'bold',
                        fontSize: 16,
                        wordBreak: 'break-word',
                        mt: 0.5
                      }}
                    >
                      {myTask?.sourceBins?.length > 0
                        ? myTask.sourceBins.map((inv: any, index: number) => (
                            <div key={index}>
                              {inv.bin?.binCode ?? '--'}: {inv.quantity ?? '--'}
                            </div>
                          ))
                        : '--'}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={4} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Product
                  </Typography>
                  <Typography fontWeight='bold'>
                    {myTask.productCode || '--'}
                  </Typography>
                </Grid>

                <Grid item xs={4} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Quantity
                  </Typography>
                  <Typography fontWeight='bold'>
                    {myTask.quantity === 0 ? 'ALL' : myTask.quantity ?? '--'}
                  </Typography>
                </Grid>

                <Grid item xs={4} textAlign='center'>
                  <Typography variant='caption' color='text.secondary'>
                    Target Bin
                  </Typography>
                  <Typography fontWeight='bold'>
                    {myTask.destinationBinCode || '--'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                sx={{ mt: 2 }}
              >
                <Typography variant='caption' color='text.secondary'>
                  Create Date: {new Date(myTask.createdAt).toLocaleString()}
                </Typography>

                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  onClick={handleCancel}
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    height: 32,
                    px: 2.5
                  }}
                >
                  Cancel
                </Button>
              </Box>

              <Button
                fullWidth
                variant='contained'
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: 14,
                  borderRadius: 2,
                  backgroundColor: '#2563eb',
                  '&:hover': {
                    backgroundColor: '#1e50c2'
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}
                onClick={() => navigate('/my-task/scan-qr')}
              >
                <QrCode size={18} color='white' />
                Scan to Load
              </Button>
            </CardContent>
          </Card>
        )}

        {!myTask &&
          (isLoading ? (
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
                        {task.sourceBins && task.sourceBins.length > 0
                          ? task.sourceBins
                              .map((inv: any) => inv.bin?.binCode)
                              .filter((code: string | undefined) => !!code)
                              .join(' / ') || '--'
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
          ))}
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
