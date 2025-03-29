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
import { useAcceptTask } from '../hooks/useTask' // 引入 useAcceptTask Hook
import { Task } from '../types/task'

const PendingTaskList: React.FC = () => {
  const { pendingTasks } = usePendingTaskContext()
  const { acceptTask, loading, error } = useAcceptTask() // 使用 Hook

  return (
    <Box p={2}>
      {pendingTasks.length === 0 ? (
        <Typography color='text.secondary'>No pending tasks found.</Typography>
      ) : (
        pendingTasks.map((task: Task) => (
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
              <Typography fontWeight='bold' fontSize={13} mb={2}>
                Task ID # {task.taskID}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant='caption' color='text.secondary'>
                    Source Bin
                  </Typography>
                  <Box>
                    {task.sourceBinCode?.length ? (
                      task.sourceBinCode.map((code, index) => (
                        <Typography key={index} fontWeight='bold' fontSize={16}>
                          {code}
                        </Typography>
                      ))
                    ) : (
                      <Typography fontWeight='bold' fontSize={16}>
                        --
                      </Typography>
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
                  onClick={() => acceptTask(task.taskID)}
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
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Accept'}
                </Button>
              </Box>
              {error && (
                <Typography color='error' mt={2}>
                  {error}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}

export default PendingTaskList
