// src/components/TaskInstruction.tsx
import React from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { useTaskContext } from '../contexts/task'

const TaskInstruction: React.FC = () => {
  const { myTask } = useTaskContext()

  if (myTask === null) return null

  return (
    <Card
      variant='outlined'
      sx={{
        mb: 3,
        borderRadius: 3,
        backgroundColor: '#e0f7fa',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
    >
      <CardContent>
        <Typography fontWeight='bold' fontSize={16} mb={1}>
          Current Task Instruction
        </Typography>

        <Box display='flex' flexDirection='column' gap={1}>
          <Typography fontSize={14}>
            <strong>Task ID:</strong> {myTask.taskID}
          </Typography>
          <Typography fontSize={14}>
            <strong>Product Code:</strong> {myTask.productCode}
          </Typography>

          <Typography fontSize={14}>
            <strong>Destination Bin:</strong>{' '}
            {myTask.destinationBinCode || '--'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default TaskInstruction
