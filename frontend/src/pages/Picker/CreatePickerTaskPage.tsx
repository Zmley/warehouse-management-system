// src/pages/Picker/CreateTaskPage.tsx

import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPickerTask } from '../../api/taskApi'
import { Bin } from '../../types/bin'

const CreateTaskPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const bin: Bin = location.state?.bin

  const [productCode, setProductCode] = useState('')

  const handleSubmit = async () => {
    if (!productCode || !bin?.binCode) {
      alert('Please select product')
      return
    }

    try {
      const task = await createPickerTask(bin.binCode, productCode)
      console.log('✅ Created Task:', task)
      alert('✅ Task created successfully!')
      navigate('/')
    } catch (err) {
      console.error('❌ Error creating task:', err)
      alert('❌ Failed to create task')
    }
  }

  return (
    <Container maxWidth='sm'>
      <Typography
        variant='h5'
        fontWeight='bold'
        mt={3}
        mb={2}
        sx={{ textDecoration: 'underline' }}
      >
        Create A Task
      </Typography>

      <Card
        variant='outlined'
        sx={{
          borderRadius: 4,
          p: 3,
          backgroundColor: '#f1f5f9',
          textAlign: 'center'
        }}
      >
        <Typography mb={2} fontWeight='medium'>
          You are about to create a task
        </Typography>

        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={3}
        >
          <Typography fontWeight='bold'></Typography>
          <Typography fontWeight='bold'>
            Target Bin{' '}
            <span style={{ fontSize: '1.2rem' }}>{bin?.binCode}</span>
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Product</InputLabel>
          <Select
            value={productCode}
            label='Product'
            onChange={e => setProductCode(e.target.value)}
          >
            <MenuItem value='p001'>p001</MenuItem>
            <MenuItem value='p002'>p002</MenuItem>
            <MenuItem value='p003'>p003</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant='outlined'
          color='error'
          fullWidth
          onClick={() => navigate('/')}
          sx={{
            borderWidth: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold',
            mb: 1
          }}
        >
          Cancel ⭕
        </Button>
      </Card>
    </Container>
  )
}

export default CreateTaskPage
