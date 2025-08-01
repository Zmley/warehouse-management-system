import React, { useState, useEffect } from 'react'
import { Box, IconButton, TextField, Autocomplete, Button } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useTranslation } from 'react-i18next'
import { setSourceBinCode } from 'utils/Storages'

interface ProductInput {
  productCode: string
  quantity: string
}

interface MultiProductInputBoxProps {
  productOptions: string[]
  onSubmit: (items: { productCode: string; quantity: number }[]) => void
  onCancel?: () => void
  defaultItems?: ProductInput[]
}

const MultiProductInputBox: React.FC<MultiProductInputBoxProps> = ({
  productOptions,
  onSubmit,
  onCancel,
  defaultItems = []
}) => {
  const { t } = useTranslation()
  const [inputs, setInputs] = useState<ProductInput[]>(
    defaultItems.length > 0 ? defaultItems : [{ productCode: '', quantity: '' }]
  )

  useEffect(() => {
    if (defaultItems.length > 0) {
      setInputs(defaultItems)
    }
  }, [defaultItems])

  const handleChange = (
    index: number,
    field: keyof ProductInput,
    value: string
  ) => {
    const updated = [...inputs]
    updated[index][field] = value
    setInputs(updated)
  }

  const handleAdd = () => {
    setInputs([...inputs, { productCode: '', quantity: '' }])
  }

  const handleRemove = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const parsed = inputs
      .map(item => ({
        productCode: item.productCode.trim(),
        quantity: parseInt(item.quantity)
      }))
      .filter(
        item => item.productCode && !isNaN(item.quantity) && item.quantity > 0
      )

    if (parsed.length > 0) {
      setSourceBinCode('staging-area')

      onSubmit(parsed)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        pt: 0,
        backgroundColor: '#fff',
        borderRadius: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {inputs.map((input, index) => (
        <Box
          key={index}
          display='flex'
          alignItems='center'
          sx={{
            bgcolor: '#f7faff',
            border: '1px solid #1976d2',
            borderRadius: 8,
            p: 1,
            mb: 1,
            width: '100%',
            gap: 1
          }}
        >
          <Autocomplete
            options={productOptions}
            value={input.productCode}
            freeSolo={false}
            openOnFocus={false}
            onInputChange={(_, value) => {
              handleChange(index, 'productCode', value)
            }}
            onChange={(_, newValue) => {
              handleChange(index, 'productCode', newValue || '')
            }}
            onBlur={e => {
              const inputValue = (e.target as HTMLInputElement).value
              if (!productOptions.includes(inputValue)) {
                handleChange(index, 'productCode', '')
              }
            }}
            filterOptions={(options, state) =>
              state.inputValue.length < 1
                ? []
                : options.filter(opt =>
                    opt.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
            }
            renderInput={params => (
              <TextField
                {...params}
                placeholder={t('scan.productCode')}
                size='small'
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 1,
                  '& .MuiInputBase-input': { fontSize: 16, padding: '8px 10px' }
                }}
              />
            )}
            sx={{ flex: 5 }}
          />

          <TextField
            placeholder={t('scan.quantity')}
            type='number'
            inputProps={{
              min: 1,
              style: { fontSize: 16, padding: '8px 10px', textAlign: 'center' }
            }}
            value={input.quantity}
            onChange={e => handleChange(index, 'quantity', e.target.value)}
            size='small'
            sx={{
              flex: 2,
              backgroundColor: '#f0f4f8',
              borderRadius: 6
            }}
          />

          <IconButton
            color='error'
            onClick={() => handleRemove(index)}
            sx={{
              backgroundColor: '#ffe5e5',
              borderRadius: '50%',
              width: 40,
              height: 40,
              '&:hover': { backgroundColor: '#ffcccc' }
            }}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Box>
      ))}

      <Box textAlign='center' mb={2}>
        <AddCircleOutlineIcon
          sx={{ color: '#1976d2', fontSize: 36, cursor: 'pointer' }}
          onClick={handleAdd}
        />
      </Box>

      <Box textAlign='center' display='flex' justifyContent='center' gap={2}>
        <Button
          onClick={handleSubmit}
          variant='contained'
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.2,
            fontWeight: 'bold',
            fontSize: '1rem',
            background: 'linear-gradient(to right, #1976d2, #42a5f5)',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
          }}
        >
          {t('scan.confirm')}
        </Button>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant='outlined'
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.2,
              fontWeight: 'bold',
              fontSize: '1rem',
              color: '#f44336',
              borderColor: '#f44336'
            }}
          >
            {t('scan.cancel')}
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default MultiProductInputBox
