import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  TextField,
  Autocomplete
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPickerTask } from '../../api/taskApi'
import { fetchAllProducts } from '../../api/productApi'
import { fetchMatchingBinCodes } from '../../api/binApi'
import { Bin } from '../../types/bin'

const CreateTaskPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const bin: Bin = location.state?.bin

  const [productCode, setProductCode] = useState('')
  const [productOptions, setProductOptions] = useState<string[]>([])
  const [sourceBins, setSourceBins] = useState<string[]>([])
  const [sourceError, setSourceError] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetchAllProducts()
        const codes = response.productCodes
        setProductOptions(codes)
      } catch (err) {
        console.error('❌ Failed to load products', err)
      }
    }
    loadProducts()
  }, [])

  useEffect(() => {
    const getSources = async () => {
      if (productCode) {
        try {
          const response = await fetchMatchingBinCodes(productCode)
          setSourceBins(response)
          setSourceError(response.length === 0)
        } catch (err) {
          console.error('❌ Failed to fetch source bins:', err)
          setSourceBins([])
          setSourceError(true)
        }
      } else {
        setSourceBins([])
        setSourceError(false)
      }
    }
    getSources()
  }, [productCode])

  const handleSubmit = async () => {
    if (!productCode || !bin?.binCode || sourceError) {
      alert('Please select a valid product and ensure bins are available.')
      return
    }

    try {
      await createPickerTask(bin.binCode, productCode)
      navigate('/success')
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
          mb={1}
        >
          <Typography fontWeight='bold'>Source Bin</Typography>
          <Typography fontWeight='bold' fontSize='1.2rem'>
            {sourceError
              ? 'No matching bins'
              : sourceBins.length > 0
              ? sourceBins.join('/')
              : '-'}
          </Typography>
        </Box>

        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={3}
        >
          <Typography fontWeight='bold'>Target Bin</Typography>
          <Typography fontWeight='bold' fontSize='1.2rem'>
            {bin?.binCode}
          </Typography>
        </Box>

        <Autocomplete
          options={productOptions}
          value={productCode}
          onChange={(_, newValue) => setProductCode(newValue || '')}
          renderInput={params => (
            <TextField {...params} label='Product Code' variant='outlined' />
          )}
          sx={{ mb: 3 }}
          freeSolo
        />

        <Button
          variant='contained'
          color='primary'
          fullWidth
          disabled={!productCode || sourceError}
          onClick={handleSubmit}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold',
            mb: 1
          }}
        >
          Create Task
        </Button>

        <Button
          variant='outlined'
          color='error'
          fullWidth
          onClick={() => navigate('/')}
          sx={{
            borderWidth: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Cancel ⭕
        </Button>
      </Card>
    </Container>
  )
}

export default CreateTaskPage
