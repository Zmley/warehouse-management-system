import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Paper,
  Autocomplete,
  Button
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
        p: 4,
        backgroundColor: '#fff',
        borderRadius: 4,
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
      }}
    >
      {inputs.map((input, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: 3,
            border: '1px solid #1976d2',
            backgroundColor: '#fdfdfd'
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
                label={t('scan.productCode')}
                size='small'
                sx={{ backgroundColor: 'white', borderRadius: 2 }}
              />
            )}
            sx={{ flex: 7 }}
          />

          <TextField
            label={t('scan.quantity')}
            type='number'
            inputProps={{ min: 1 }}
            value={input.quantity}
            onChange={e => handleChange(index, 'quantity', e.target.value)}
            size='small'
            sx={{ flex: 3, backgroundColor: 'white', borderRadius: 2 }}
          />

          <IconButton
            color='error'
            onClick={() => handleRemove(index)}
            sx={{ flex: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Paper>
      ))}

      <Box textAlign='center' mb={2}>
        <IconButton onClick={handleAdd} color='primary'>
          <AddCircleOutlineIcon sx={{ fontSize: 32 }} />
        </IconButton>
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
