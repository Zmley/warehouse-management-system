import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Tooltip
} from '@mui/material'
import { useTaskContext } from 'contexts/task'
import { useCartContext } from 'contexts/cart'
import { useTask } from 'hooks/useTask'

const TaskInstruction: React.FC = () => {
  const { myTask, setMyTask } = useTaskContext()
  const { inventoriesInCar } = useCartContext()
  const { cancelMyTask, releaseTask } = useTask()

  if (!myTask) return null

  const hasCargo = inventoriesInCar.length > 0

  const handleCancel = async () => {
    try {
      await cancelMyTask(myTask.taskID)
      setMyTask(null)
    } catch (err) {
      console.error('❌ Failed to cancel task', err)
    }
  }

  const handleRelease = async () => {
    try {
      await releaseTask(myTask.taskID)
      setMyTask(null)
    } catch (err) {
      console.error('❌ Failed to release task', err)
    }
  }

  return (
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
              {myTask.sourceBins?.length > 0
                ? myTask.sourceBins.map((inv: any, index: number) => (
                    <div key={index}>
                      {inv.bin?.binCode ?? '--'}: {inv.quantity ?? '--'}
                    </div>
                  ))
                : '--'}
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

        <Box display='flex' justifyContent='flex-end' gap={2}>
          {/* Cancel Button */}
          <Tooltip
            title={
              hasCargo
                ? '❌ Cannot cancel after loading cargo'
                : 'Cancel this task'
            }
          >
            <span>
              <Button
                variant='outlined'
                color='error'
                size='small'
                disabled={hasCargo}
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
            </span>
          </Tooltip>

          {/* Release Button */}
          <Tooltip
            title={
              hasCargo
                ? 'Release this task to the aisle'
                : '❌ Load cargo first to release'
            }
          >
            <span>
              <Button
                variant='contained'
                color='success'
                size='small'
                disabled={!hasCargo}
                onClick={handleRelease}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  height: 32,
                  px: 2.5
                }}
              >
                Release
              </Button>
            </span>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  )
}

export default TaskInstruction
