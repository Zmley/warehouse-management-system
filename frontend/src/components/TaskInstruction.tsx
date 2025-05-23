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
  const { cancelMyTask } = useTask()

  if (!myTask) return null

  const isCancelable = inventoriesInCar.length === 0

  const handleCancel = async () => {
    try {
      await cancelMyTask(myTask.taskID)
      setMyTask(null)
    } catch (err) {
      console.error('❌ Failed to cancel task', err)
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

        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{ mt: 1 }}
        >
          <Typography variant='caption' color='text.secondary'>
            Create Date: {new Date(myTask.createdAt).toLocaleString()}
          </Typography>

          <Tooltip
            title={
              isCancelable
                ? 'Cancel this task'
                : '❌ You must unload your cart first'
            }
          >
            <span>
              <Button
                variant='outlined'
                color='error'
                size='small'
                disabled={!isCancelable}
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
        </Box>
      </CardContent>
    </Card>
  )
}

export default TaskInstruction
