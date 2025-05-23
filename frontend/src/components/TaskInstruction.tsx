import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { useTaskContext } from 'contexts/task'

const TaskInstruction: React.FC = () => {
  const { myTask } = useTaskContext()

  if (!myTask) return null

  return (
    <Box sx={{ mt: 8, mx: 2 }}>
      <Typography
        variant='h5'
        fontWeight='bold'
        gutterBottom
        sx={{ textAlign: 'center', mb: 3 }}
      >
        My Current Task
      </Typography>

      <Card
        variant='outlined'
        sx={{
          borderRadius: 3,
          backgroundColor: '#e3f2fd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent>
          <Box display='flex' flexDirection='column' gap={1}>
            <Typography fontSize={15}>
              <strong>Task ID:</strong> {myTask.taskID}
            </Typography>
            <Typography fontSize={15}>
              <strong>Product Code:</strong> {myTask.productCode}
            </Typography>
            <Typography fontSize={15}>
              <strong>Quantity:</strong>{' '}
              {myTask.quantity === 0 ? 'ALL' : myTask.quantity ?? '--'}
            </Typography>
            <Typography fontSize={15}>
              <strong>Destination Bin:</strong>{' '}
              {myTask.destinationBinCode || '--'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TaskInstruction
