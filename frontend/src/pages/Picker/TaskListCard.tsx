import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { usePickerTasks } from 'hooks/usePickerTask'
import { TaskCategoryEnum } from 'types/task'

interface Props {
  status: TaskCategoryEnum
}

const TaskListCard: React.FC<Props> = ({ status }) => {
  const { cancelTask, tasks, fetchTasks } = usePickerTasks()

  const [hasFetched, setHasFetched] = useState(false)
  const [isLoadingTaskID, setIsLoadingTaskID] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks().then(() => setHasFetched(true))
  }, [fetchTasks])

  const handleManualRefresh = async () => {
    await fetchTasks()
  }

  const handleCancel = async (taskID: string) => {
    setIsLoadingTaskID(taskID)
    const result = await cancelTask(taskID)
    if (result) {
      await fetchTasks()
    } else {
      alert('❌ Failed to cancel task')
    }
    setIsLoadingTaskID(null)
  }

  const filteredTasks = tasks.filter(task => task.status === status)

  return (
    <PullToRefresh
      onRefresh={handleManualRefresh}
      refreshingContent={
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={28} thickness={5} />
          <Typography variant='caption' display='block' sx={{ mt: 1 }}>
            Refreshing tasks...
          </Typography>
        </Box>
      }
    >
      <Box p={2}>
        {!hasFetched ? (
          <Box display='flex' justifyContent='center' mt={6}>
            <CircularProgress />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Typography color='text.secondary' textAlign='center'>
            No {status.toLowerCase()} tasks found.
          </Typography>
        ) : (
          filteredTasks.map(task => (
            <Card
              key={task.taskID}
              variant='outlined'
              sx={{
                mb: 3,
                borderRadius: 4,
                backgroundColor: '#f8faff',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)'
              }}
            >
              <CardContent>
                <Typography fontWeight='bold' fontSize={13} mb={2}>
                  Task ID # {task.taskID}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant='caption' color='text.secondary'>
                      Source Bin
                    </Typography>
                    <Box>
                      {Array.isArray(task.sourceBins) &&
                      task.sourceBins.length > 0 ? (
                        task.sourceBins.map((item, idx) => (
                          <Typography
                            key={idx}
                            fontWeight='bold'
                            fontSize={16}
                            component='span'
                          >
                            {typeof item === 'string'
                              ? item
                              : item.bin?.binCode || '--'}
                            {idx < task.sourceBins.length - 1 && ' / '}
                          </Typography>
                        ))
                      ) : (
                        <Typography fontWeight='bold'>--</Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant='caption' color='text.secondary'>
                      Product
                    </Typography>
                    <Typography fontWeight='bold'>
                      {task.productCode}
                    </Typography>
                  </Grid>

                  <Grid item xs={4}>
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

                  {status === 'PENDING' && (
                    <Button
                      variant='outlined'
                      color='error'
                      onClick={() => handleCancel(task.taskID)}
                      disabled={isLoadingTaskID === task.taskID}
                      sx={{
                        fontWeight: 600,
                        px: 1.5,
                        py: 0.8,
                        textTransform: 'uppercase',
                        borderRadius: 1.5,
                        fontSize: 11,
                        minWidth: '72px'
                      }}
                    >
                      {isLoadingTaskID === task.taskID
                        ? 'Cancelling...'
                        : 'Cancel'}
                    </Button>
                  )}

                  {status === 'COMPLETED' && (
                    <Typography
                      fontWeight='bold'
                      fontSize={12}
                      color='success.main'
                    >
                      Completed
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </PullToRefresh>
  )
}

export default TaskListCard
