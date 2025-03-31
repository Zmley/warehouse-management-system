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
import { Task } from '../../types/task'
import { cancelPickerTask } from '../../api/taskApi'
import { bin } from '../../types/bin'

interface Props {
  createdTasks: Task[]
  onRefresh: () => void
  status: 'PENDING' | 'COMPLETED'
}

const PickerCreatedTaskList: React.FC<Props> = ({
  createdTasks,
  onRefresh,
  status
}) => {
  const handleCancel = async (taskID: string) => {
    try {
      await cancelPickerTask(taskID)
      onRefresh()
    } catch (err) {
      console.error('❌ Failed to cancel task:', err)
      alert('❌ Failed to cancel task')
    }
  }

  return (
    <Box p={2}>
      {createdTasks.length === 0 ? (
        <Typography color='text.secondary'>
          No {status.toLowerCase()} tasks found.
        </Typography>
      ) : (
        createdTasks.map(task => (
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
                    {task.sourceBins?.length > 0 ? (
                      task.sourceBins.map((item, idx) => (
                        <Typography key={idx} fontWeight='bold' fontSize={16}>
                          {item.Bin?.binCode || '--'}
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
                  <Typography fontWeight='bold'>{task.productCode}</Typography>
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
                    Cancel
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

export default PickerCreatedTaskList
