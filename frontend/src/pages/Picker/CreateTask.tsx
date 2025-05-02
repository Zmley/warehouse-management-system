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
import { usePickerTasks } from 'hooks/usePickerTask'
import { useProduct } from 'hooks/useProduct'
import { useBin } from 'hooks/useBin'
import { Bin } from 'types/bin'

const CreateTask = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const bin: Bin = location.state?.bin

  const [productCode, setProductCode] = useState('')
  const [sourceBins, setSourceBins] = useState<
    { binCode: string; quantity: number }[]
  >([])
  const [sourceError, setSourceError] = useState(false)

  const { productCodes, loadProducts } = useProduct()
  const { createTask, loading, error } = usePickerTasks()
  const { fetchBinCodes } = useBin()

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const getSources = async () => {
      if (productCode) {
        try {
          const response = await fetchBinCodes(productCode)
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
  }, [productCode, fetchBinCodes])

  const handleSubmit = async () => {
    if (!productCode || !bin?.binCode || sourceError) {
      alert('Please select a valid product and ensure bins are available.')
      return
    }

    await createTask(bin.binCode, productCode)
    if (!error) {
      navigate('/success')
    } else {
      alert(error)
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

          {/* ✅ Source Bin */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='flex-start'
            my={2}
          >
            <Typography fontWeight='bold' sx={{ mt: 0.5 }}>
              Source Bins
            </Typography>
            <Paper
              variant='outlined'
              sx={{
                px: 2,
                py: 1,
                backgroundColor: sourceError ? '#ffcdd2' : '#e3f2fd',
                borderRadius: 2,
                minWidth: '180px'
              }}
            >
              {sourceError ? (
                <Typography fontWeight='bold'>No matching bins</Typography>
              ) : sourceBins.length ? (
                <Box>
                  {sourceBins.length ? (
                    sourceBins.map(({ binCode, quantity }) => (
                      <Typography key={binCode} fontSize={14}>
                        {binCode} (Qty: {quantity})
                      </Typography>
                    ))
                  ) : (
                    <Typography>-</Typography>
                  )}
                </Box>
              ) : (
                <Typography>-</Typography>
              )}
            </Paper>
          </Box>

          {/* ✅ Target Bin */}
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

          {/* ✅ Product Selector */}
          <Autocomplete
            options={productCodes}
            value={productCode}
            onChange={(_, newValue) => setProductCode(newValue || '')}
            renderInput={params => (
              <TextField {...params} label='Product Code' variant='outlined' />
            )}
            freeSolo
            sx={{ mb: 3, mt: 2 }}
          />

          {/* ✅ Create Button */}
          <Button
            variant='contained'
            color='primary'
            fullWidth
            disabled={!productCode || sourceError || loading}
            onClick={handleSubmit}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1,
              mb: 2
            }}
          >
            {loading ? 'Creating Task...' : 'Create Task'}
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

export default CreateTask
