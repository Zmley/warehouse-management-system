import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePickerTasks } from 'hooks/usePickerTask'
import { useBin } from 'hooks/useBin'
import { Bin } from 'types/bin'
import { useTranslation } from 'react-i18next'

const CreateTask = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const bin: Bin = location.state?.bin

  const productOptions = bin?.defaultProductCodes?.split(',') || []
  const [productCode, setProductCode] = useState(productOptions[0] || '')

  const [sourceBins, setSourceBins] = useState<
    { binCode: string; quantity: number }[]
  >([])
  const [sourceError, setSourceError] = useState(false)

  const { createTask, isLoading, error } = usePickerTasks()
  const { fetchBinCodesByProductCode } = useBin()

  useEffect(() => {
    const getSources = async () => {
      if (productCode) {
        try {
          const response = await fetchBinCodesByProductCode(productCode)
          setSourceBins(response)
          setSourceError(response.length === 0)
        } catch (err) {
          console.error('❌ Failed to fetch source bins:', err)
          setSourceBins([])
          setSourceError(true)
        }
      }
    }
    getSources()
  }, [productCode, fetchBinCodesByProductCode])

  const handleSubmit = async () => {
    if (!productCode || !bin?.binCode) return

    const task = await createTask(bin.binCode, productCode)
    if (task) {
      navigate('/success')
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
            boxShadow: '0 10px 20px #00000014'
          }}
        >
          <Typography
            variant='h5'
            fontWeight='bold'
            gutterBottom
            align='center'
          >
            {t('createTask.title')}
          </Typography>

          {/* ✅ Target Bin */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            my={2}
          >
            <Typography fontWeight='bold'>
              {t('createTask.targetBin')}
            </Typography>
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

          {/* ✅ Product Code */}
          <Box my={2}>
            <Typography fontWeight='bold' gutterBottom>
              {t('createTask.productCode')}
            </Typography>
            {productOptions.length > 1 ? (
              <RadioGroup
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
                sx={{ pl: 1 }}
              >
                {productOptions.map(code => (
                  <FormControlLabel
                    key={code}
                    value={code}
                    control={<Radio />}
                    label={code}
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontWeight: 500
                      }
                    }}
                  />
                ))}
              </RadioGroup>
            ) : (
              <Paper
                variant='outlined'
                sx={{
                  px: 2,
                  py: 0.5,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 2,
                  display: 'inline-block'
                }}
              >
                <Typography fontWeight='bold'>{productCode}</Typography>
              </Paper>
            )}
          </Box>

          {/* ✅ Source Bins */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='flex-start'
            my={2}
          >
            <Typography fontWeight='bold' sx={{ mt: 0.5 }}>
              {t('createTask.sourceBins')}
            </Typography>
            <Paper
              variant='outlined'
              sx={{
                px: 2,
                py: 1,
                backgroundColor: sourceError ? '#ffcdd2' : '#f0f4c3',
                borderRadius: 2,
                minWidth: '180px'
              }}
            >
              {isLoading ? (
                <Box display='flex' justifyContent='center'>
                  <CircularProgress size={20} />
                </Box>
              ) : sourceError ? (
                <Typography fontWeight='bold'>
                  {t('createTask.noMatchingBins')}
                </Typography>
              ) : sourceBins.length ? (
                <Box>
                  {sourceBins.map(({ binCode, quantity }) => (
                    <Typography key={binCode} fontSize={14}>
                      {binCode} ({t('createTask.qty')}: {quantity})
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography>-</Typography>
              )}
            </Paper>
          </Box>

          {/* ✅ Create Button */}
          <Button
            variant='contained'
            color='primary'
            fullWidth
            disabled={!productCode || isLoading}
            onClick={handleSubmit}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1,
              mb: 2
            }}
          >
            {isLoading
              ? t('createTask.loading')
              : sourceError
                ? t('createTask.outOfStock')
                : t('createTask.create')}
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
            ❌ {t('createTask.cancel')}
          </Button>

          {error && (
            <Typography
              color='error'
              fontWeight='bold'
              textAlign='center'
              mb={2}
            >
              {error}
            </Typography>
          )}
        </Card>
      </Container>
    </Box>
  )
}

export default CreateTask
