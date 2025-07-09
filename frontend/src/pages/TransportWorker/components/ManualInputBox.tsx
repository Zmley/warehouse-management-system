import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Autocomplete,
  Button,
  Paper
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useTranslation } from 'react-i18next'

interface ProductInput {
  productCode: string
  quantity: string
}

interface MultiProductInputBoxProps {
  productOptions: string[]
  onSubmit: (items: { productCode: string; quantity: number }[]) => void
  defaultItems?: ProductInput[]
}

const MultiProductInputBox: React.FC<MultiProductInputBoxProps> = ({
  productOptions,
  onSubmit,
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
      onSubmit(parsed)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 650,
        p: 2,
        backgroundColor: '#fff',
        borderRadius: 2
      }}
    >
      {inputs.map((input, index) => (
        <Box
          key={index}
          display='flex'
          alignItems='center'
          sx={{
            bgcolor: '#e3f2fd',
            border: '1px solid #1976d2',
            borderRadius: 2,
            p: 1,
            mb: 1
          }}
        >
          <Autocomplete
            options={productOptions}
            value={input.productCode}
            onInputChange={(_, value) =>
              handleChange(index, 'productCode', value)
            }
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
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '6px 8px'
                  }
                }}
              />
            )}
            sx={{ flex: 6 }}
          />

          <TextField
            placeholder={t('scan.quantity')}
            type='number'
            inputProps={{
              min: 1,
              style: { fontSize: 13, padding: '6px 8px', textAlign: 'center' }
            }}
            value={input.quantity}
            onChange={e => handleChange(index, 'quantity', e.target.value)}
            size='small'
            sx={{
              flex: 3,
              ml: 1,
              backgroundColor: '#f0f4f8',
              borderRadius: 1
            }}
          />

          <IconButton
            color='error'
            onClick={() => handleRemove(index)}
            sx={{ flex: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Box textAlign='center' mb={2}>
        <AddCircleOutlineIcon
          sx={{ color: '#1976d2', fontSize: 32 }}
          onClick={handleAdd}
        />
      </Box>

      <Box textAlign='center'>
        <Button
          onClick={handleSubmit}
          variant='contained'
          sx={{
            borderRadius: 3,
            px: 6,
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '1rem',
            background: 'linear-gradient(to right, #1976d2, #42a5f5)',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
          }}
        >
          {t('scan.confirm')}
        </Button>
      </Box>
    </Box>
  )
}

export default MultiProductInputBox
