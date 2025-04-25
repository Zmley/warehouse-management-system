import React from 'react'
import {
  Box,
  TextField,
  Checkbox,
  Typography,
  Divider,
  Snackbar,
  Alert
} from '@mui/material'
import { InventoryItem } from 'types/inventory'
import { sanitizeQuantityInput } from 'utils/inputHelpers'

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
  taskType,
  inventories,
  selectedList,
  onQuantityChange,
  onSelectionChange
}) => {
  const [errorOpen, setErrorOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleInputChange = (inventoryID: string, value: string) => {
    const numericValue = sanitizeQuantityInput(value)

    const inventory = inventories.find(i => i.inventoryID === inventoryID)
    if (inventory && numericValue > inventory.quantity) {
      setErrorMessage(`Quantity cannot exceed total (${inventory.quantity})`)
      setErrorOpen(true)
      return
    }

    onQuantityChange(inventoryID, numericValue)
  }

  return (
    <Box>
      <Box
        sx={{
          backgroundColor: '#f0f4f7',
          borderRadius: 3,
          p: 2,
          mb: 2
        }}
      >
        <Typography fontWeight='bold'>Task Type # {taskType}</Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {selectedList.map(item => {
        const inv = inventories.find(i => i.inventoryID === item.inventoryID)
        return (
          <Box
            key={item.inventoryID}
            sx={{
              mt: 2,
              p: 1,
              borderRadius: 2,
              backgroundColor: item.selected ? '#e9f1f7' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1
            }}
          >
            {/* Product Info */}
            <Box
              sx={{ display: 'flex', flexDirection: 'column', width: '50%' }}
            >
              <Typography fontSize={14} fontWeight='bold'>
                #{inv?.productCode}
              </Typography>
              <Typography fontSize={12}>
                Total <strong>{inv?.quantity}</strong>
              </Typography>
            </Box>

            {/* Offload Input and Checkbox */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '60%',
                justifyContent: 'space-between'
              }}
            >
              <Typography fontSize={12} sx={{ mr: 3 }}>
                Offload
              </Typography>
              <TextField
                size='small'
                type='number'
                value={item.quantity}
                sx={{ width: 120 }}
                disabled={item.selected}
                onChange={e =>
                  handleInputChange(item.inventoryID, e.target.value)
                }
                inputProps={{ min: 0 }}
              />
              <Checkbox
                checked={item.selected}
                onChange={() => onSelectionChange(item.inventoryID)}
                sx={{ ml: 2 }}
              />
            </Box>
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
