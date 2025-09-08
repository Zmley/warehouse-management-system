import React, { useEffect, useState } from 'react'
import {
  Button,
  Typography,
  Card,
  TextField,
  Autocomplete,
  Box,
  CircularProgress,
  Divider
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePickerTasks } from 'hooks/usePickerTask'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { PICKER_TASK_ERROR_CODE } from 'utils/errorCodes'

interface Props {
  onSuccess?: () => void
  onClose?: () => void
}

const CreatePickerTask: React.FC<Props> = ({ onSuccess }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [productCode, setProductCode] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [pickupBinCode, setPickupBinCode] = useState('')
  const [sourceBinCodes, setSourceBinCodes] = useState<
    { binCode: string; quantity: number }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { createPickTask, error, setError } = usePickerTasks()
  const { fetchAvailableBinCodes, getPickUpBinByProductCode } = useBin()
  const { productCodes, fetchProductCodes } = useProduct()

  useEffect(() => {
    fetchProductCodes()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLocalError(null)
      setError(null)
      if (!productCode || productCode === 'ALL') {
        setSourceBinCodes([])
        setPickupBinCode('')
        return
      }

      setLoading(true)
      try {
        const [sourceBins, pickupRes] = await Promise.all([
          fetchAvailableBinCodes(productCode),
          getPickUpBinByProductCode(productCode)
        ])
        setSourceBinCodes(sourceBins)
        if (pickupRes.success && pickupRes.data) {
          setPickupBinCode(pickupRes.data)
        } else {
          setPickupBinCode('')
        }
      } catch (err) {
        console.error('❌ Failed to fetch bin info', err)
        setSourceBinCodes([])
        setPickupBinCode('')
        setLocalError(t('picker.error.fetchFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productCode, setError])

  const handleSubmit = async () => {
    setLocalError(null)
    setError(null)

    if (!productCode) {
      setLocalError(t('picker.error.noProductCode'))
      return
    }

    if (!pickupBinCode) {
      setLocalError(t('picker.error.noPickupBin'))
      return
    }

    const result = await createPickTask(productCode, pickupBinCode)

    if (result) {
      onSuccess?.()
      setProductCode('')
      setInputValue('')
      setPickupBinCode('')
      setSourceBinCodes([])

      navigate('/success')
    } else {
      try {
        setLoading(true)
        const [sourceBins, pickupRes] = await Promise.all([
          fetchAvailableBinCodes(productCode),
          getPickUpBinByProductCode(productCode)
        ])
        setSourceBinCodes(sourceBins)
        if (pickupRes.success && pickupRes.data) {
          setPickupBinCode(pickupRes.data)
        } else {
          setPickupBinCode('')
        }
      } catch (err) {
        console.error('❌ Failed to re-fetch bin info after task failure')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card
      elevation={6}
      sx={{
        p: 4,
        borderRadius: '20px',
        backgroundColor: '#fafafa',
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      <Typography variant='h5' fontWeight='bold' mb={2}>
        {t('picker.title')}
      </Typography>

      <Autocomplete
        freeSolo
        value={productCode}
        inputValue={inputValue}
        onInputChange={(_, val) => setInputValue(val)}
        onChange={(_, val) => {
          setProductCode(val || '')
          setInputValue(val || '')
        }}
        options={
          inputValue.length === 0
            ? []
            : productCodes.filter(code =>
                code.toLowerCase().startsWith(inputValue.toLowerCase())
              )
        }
        renderInput={params => (
          <TextField
            {...params}
            label={t('picker.productCode')}
            fullWidth
            variant='outlined'
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setProductCode((e.target as HTMLInputElement).value.trim())
              }
            }}
          />
        )}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box display='flex' justifyContent='center' mt={3}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          {pickupBinCode && (
            <Typography sx={{ fontWeight: 500, mt: 1 }}>
              {t('picker.pickupBin')} <strong>{pickupBinCode}</strong>
            </Typography>
          )}

          {sourceBinCodes.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant='subtitle1' fontWeight='bold' mb={1}>
                {t('picker.sourceBinList')}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2
                }}
              >
                {sourceBinCodes.map(({ binCode, quantity }) => (
                  <Box
                    key={binCode}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      backgroundColor: '#e0f7fa',
                      borderRadius: 2,
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    {binCode} · {t('picker.qty')}: {quantity}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </>
      )}

      <Button
        fullWidth
        variant='contained'
        onClick={handleSubmit}
        sx={{
          borderRadius: 3,
          fontWeight: 'bold',
          py: 1.2,
          fontSize: '1rem',
          mt: 2
        }}
      >
        {sourceBinCodes.length === 0
          ? t('picker.createOutOfStockTask')
          : t('picker.createTask')}
      </Button>

      {(localError || error) && (
        <Typography color='error' sx={{ mt: 3, fontWeight: 500 }}>
          {localError
            ? localError
            : t(
                error
                  ? PICKER_TASK_ERROR_CODE[error] || 'createTask.error.unknown'
                  : 'createTask.error.unknown'
              )}
        </Typography>
      )}
    </Card>
  )
}

export default CreatePickerTask
