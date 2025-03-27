import React from 'react'
import { Box, Typography, Card, CardContent, Button, Grid } from '@mui/material'
import { usePendingTaskContext } from '../contexts/pendingTask'
import { useNavigate } from 'react-router-dom'
import { acceptTask } from '../api/taskApi'
import { Task } from '../types/task'
import { useBinCodeContext } from '../contexts/binCode'
import { useCartContext } from '../contexts/cart'

const PendingTaskList: React.FC = () => {
  const { setDestinationBinCode } = useBinCodeContext()
  const { setSelectedForUnload, inventoryListInCar } = useCartContext()
  const { pendingTasks, setInProcessTask, fetchInProcessTask } =
    usePendingTaskContext()
  const navigate = useNavigate()

  const handleAcceptTask = async (task: Task) => {
    try {
      const res = await acceptTask(task.taskID)

      if (res && res.task) {
        const currentTask = await fetchInProcessTask()

        if (currentTask) {
          // setDestinationBinCode(currentTask.destinationBinCode?.[0] || null)

          // if (currentTask.productCode === 'ALL') {
          //   const allItems = inventoryListInCar.map(item => ({
          //     inventoryID: item.inventoryID,
          //     quantity: item.quantity
          //   }))
          //   setSelectedForUnload(allItems)
          // } else {
          //   const matchedItems = inventoryListInCar
          //     .filter(item => item.productCode === currentTask.productCode)
          //     .map(item => ({
          //       inventoryID: item.inventoryID,
          //       quantity: item.quantity
          //     }))
          //   setSelectedForUnload(matchedItems)
          // }

          navigate('/task-detail')
        } else {
          console.warn('⚠️ No in-process task returned after accepting.')
        }
      } else {
        console.warn('⚠️ Task accept API did not return expected task.')
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
              mb: 2,
              borderRadius: 3,
              backgroundColor: '#f1f6fa',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <CardContent>
              <Typography fontWeight='bold' fontSize={14} mb={1}>
                Task ID # {task.taskID}
              </Typography>

              <Grid container spacing={2} alignItems='center' mb={1}>
                <Grid item xs={4}>
                  <Typography variant='caption'>Source Bin</Typography>
                  <Typography fontWeight='bold' fontSize={20}>
                    {task.sourceBinCode?.join(', ') || '--'}
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant='caption'>Product Code</Typography>
                  <Typography fontWeight='bold' fontSize={20}>
                    {task.productCode}
                  </Typography>
                </Grid>

                <Grid item xs={4} display='flex' justifyContent='flex-end'>
                  <Button onClick={() => handleAcceptTask(task)}>Accept</Button>
                </Grid>
              </Grid>

              <Typography variant='caption' color='text.secondary'>
                Create Date {new Date(task.createdAt).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}

export default PendingTaskList
