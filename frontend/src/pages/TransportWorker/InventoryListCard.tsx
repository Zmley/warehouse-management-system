import React from 'react'
import {
  Box,
  TextField,
  Checkbox,
  Typography,
  Snackbar,
  Alert
} from '@mui/material'
import { InventoryItem } from 'types/inventory'
import { sanitizeQuantityInput } from 'utils/inputHelpers'
import { useTranslation } from 'react-i18next'

interface Props {
  taskType: string
  inventories: InventoryItem[]
  selectedList: {
    inventoryID: string
    quantity: number | string
    selected: boolean
  }[]
  onQuantityChange: (inventoryID: string, newQuantity: number) => void
  onSelectionChange: (inventoryID: string) => void
}

const InventoryListCard: React.FC<Props> = ({
  inventories,
  selectedList,
  onQuantityChange,
  onSelectionChange
}) => {
  const [errorOpen, setErrorOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const { t } = useTranslation()

  const handleInputChange = (inventoryID: string, value: string) => {
    const numericValue = sanitizeQuantityInput(value)

    const inventory = inventories.find(i => i.inventoryID === inventoryID)
    if (inventory && numericValue > inventory.quantity) {
      setErrorMessage(
        t('inventory.quantityExceed', { quantity: inventory.quantity })
      )
      setErrorOpen(true)
      return
    }

    onQuantityChange(inventoryID, numericValue)
  }

  return (
    <Box>
      {selectedList.map(item => {
        const inv = inventories.find(i => i.inventoryID === item.inventoryID)
        return (
          <Box
            key={item.inventoryID}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.5,
              px: 1,
              mb: 1,
              borderRadius: 1.5,
              backgroundColor: item.selected ? '#e6f2fa' : '#f9f9f9',
              border: '1px solid #e0e0e0',
              fontSize: 12
            }}
          >
            {/* Checkbox */}
            <Checkbox
              size='small'
              checked={item.selected}
              onChange={() => onSelectionChange(item.inventoryID)}
              sx={{ p: 0.5, mr: 1 }}
            />

            {/* Product Info */}
            <Box sx={{ flex: 1, minWidth: 90 }}>
              <Typography fontSize={13}>#{inv?.productCode}</Typography>
              <Typography fontSize={11} color='text.secondary'>
                {t('inventory.total')} {inv?.quantity}
              </Typography>
            </Box>

            {/* Label */}
            <Typography fontSize={11} sx={{ mx: 1 }}>
              {t('inventory.offload')}
            </Typography>

            {/* Quantity input */}
            <TextField
              size='small'
              type='number'
              value={item.quantity}
              disabled={item.selected}
              onChange={e =>
                handleInputChange(item.inventoryID, e.target.value)
              }
              sx={{
                width: 70,
                '& .MuiInputBase-input': {
                  fontSize: 12,
                  py: 0.5
                }
              }}
              inputProps={{ min: 0 }}
            />
          </Box>
        )
      })}

      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
        onClose={() => setErrorOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity='error'
          onClose={() => setErrorOpen(false)}
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default InventoryListCard
