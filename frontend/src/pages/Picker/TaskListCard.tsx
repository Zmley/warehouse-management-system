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
import { usePickerTasks, useAutoRefresh } from 'hooks/usePickerTask'
import { TaskCategoryEnum } from 'types/task'

interface Props {
  status: TaskCategoryEnum
}

const TaskListCard: React.FC<Props> = ({ status }) => {
  const { cancelTask } = usePickerTasks()
  const { tasks, fetchTasks } = usePickerTasks()

  const [isLoadingTaskID, setIsLoadingTaskID] = useState<string | null>(null)

  useAutoRefresh(fetchTasks)

  const handleCancel = async (taskID: string) => {
    setIsLoadingTaskID(taskID)
    const result = await cancelTask(taskID)
    if (result) {
      fetchTasks()
    } else {
      alert('❌ Failed to cancel task')
    }
    setIsLoadingTaskID(null)
  }

  return (
    <Box p={2}>
      {tasks.length === 0 ? (
        <Typography color='text.secondary'>
          No {status.toLowerCase()} tasks found.
        </Typography>
      ) : (
        tasks
          .filter(task => task.status === status)
          .map(task => (
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
  )
}

export default TaskListCard
