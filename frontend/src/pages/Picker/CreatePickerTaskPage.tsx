import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  TextField,
  Autocomplete,
  Paper
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
        setProductOptions(response.productCodes)
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #e0f7fa, #f1f8e9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth='sm'>
        <Card
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 5,
            backgroundColor: 'white',
            boxShadow: '0 10px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Typography
            variant='h5'
            fontWeight='bold'
            gutterBottom
            align='center'
          >
            Create A New Task
          </Typography>

          {/* Source Bin Display */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            my={2}
          >
            <Typography fontWeight='bold'>Source Bin</Typography>
            <Paper
              variant='outlined'
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: sourceError ? '#ffcdd2' : '#e3f2fd',
                borderRadius: 2
              }}
            >
              <Typography fontWeight='bold'>
                {sourceError
                  ? 'No matching bins'
                  : sourceBins.length
                  ? sourceBins.join(', ')
                  : '-'}
              </Typography>
            </Paper>
          </Box>

          {/* Target Bin Display */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            my={2}
          >
            <Typography fontWeight='bold'>Target Bin</Typography>
            <Paper
              variant='outlined'
              sx={{
                px: 2,
                py: 0.5,
                backgroundColor: '#fff3e0',
                borderRadius: 2
              }}
            >
              <Typography fontWeight='bold'>{bin?.binCode || '-'}</Typography>
            </Paper>
          </Box>

          {/* Product Autocomplete */}
          <Autocomplete
            options={productOptions}
            value={productCode}
            onChange={(_, newValue) => setProductCode(newValue || '')}
            renderInput={params => (
              <TextField {...params} label='Product Code' variant='outlined' />
            )}
            freeSolo
            sx={{ mb: 3, mt: 2 }}
          />

          {/* Submit Button */}
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
              py: 1,
              mb: 2
            }}
          >
            Create Task
          </Button>

          {/* Cancel Button */}
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
              py: 1
            }}
          >
            ❌ Cancel
          </Button>
        </Card>
      </Container>
    </Box>
  )
}

export default CreateTaskPage
