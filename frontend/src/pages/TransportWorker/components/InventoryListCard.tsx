import React from 'react'
import {
  Box,
  TextField,
  Checkbox,
  Typography,
  Snackbar,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import UndoIcon from '@mui/icons-material/Undo'
import { InventoryItem } from 'types/inventory'
import { sanitizeQuantityInput } from 'utils/inputHelpers'
import { useTranslation } from 'react-i18next'
import { useTaskContext } from 'contexts/task'

interface Props {
  taskType: string
  inventories: (InventoryItem & { pickupBinCode?: string[] })[]
  selectedList: {
    inventoryID: string
    quantity: number | string
    selected: boolean
  }[]
  onQuantityChange: (inventoryID: string, newQuantity: number) => void
  onSelectionChange: (inventoryID: string) => void
  onReturnClick?: () => void
}

const InventoryListCard: React.FC<Props> = ({
  inventories,
  selectedList,
  onQuantityChange,
  onSelectionChange,
  onReturnClick
}) => {
  const [errorOpen, setErrorOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const { t } = useTranslation()
  const { myTask } = useTaskContext()

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

  const isCartEmpty = inventories.length === 0
  const shouldLookDisabled = !!myTask || isCartEmpty

  return (
    <Box>
      <Box sx={{ textAlign: 'center', position: 'relative', mb: 1 }}>
        <Typography variant='subtitle1' fontWeight='bold'>
          {t('inventory.currentCargoInForklift')}
        </Typography>

        {onReturnClick && (
          <Tooltip title={t('inventory.returnToSource')} arrow>
            <span>
              <IconButton
                size='small'
                onClick={onReturnClick}
                disabled={shouldLookDisabled}
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: -5,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: shouldLookDisabled ? 'white' : '#f1f1f1'
                  },
                  opacity: shouldLookDisabled ? 0.4 : 1,
                  cursor: shouldLookDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                <UndoIcon
                  fontSize='small'
                  color={shouldLookDisabled ? 'disabled' : 'primary'}
                />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ my: 1.2 }} />

      <Box
        sx={{
          maxHeight: 320,
          overflowY: selectedList.length > 4 ? 'auto' : 'visible',
          pr: 1
        }}
      >
        {selectedList.map(item => {
          const inv = inventories.find(i => i.inventoryID === item.inventoryID)

          return (
            <Box
              key={item.inventoryID}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.6,
                px: 1,
                mb: 1,
                borderRadius: 1.5,
                backgroundColor: item.selected ? '#e6f2fa' : '#f9f9f9',
                border: '1px solid #e0e0e0',
                fontSize: 12
              }}
            >
              {/* 勾选框 */}
              <Checkbox
                size='small'
                checked={item.selected}
                onChange={() => onSelectionChange(item.inventoryID)}
                sx={{ p: 0.5, mr: 1 }}
              />

              {/* 产品信息 */}
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography fontSize={13} fontWeight={600}>
                  #{inv?.productCode} ({inv?.quantity})
                </Typography>
                <Typography fontSize={11} color='text.secondary'>
                  {t('inventory.pickupBin')}:{' '}
                  {inv?.pickupBinCode?.join(', ') || '-'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography fontSize={12} color='text.secondary'>
                  {t('inventory.offload')}
                </Typography>
                <TextField
                  size='small'
                  type='number'
                  value={item.quantity}
                  disabled={item.selected}
                  onChange={e =>
                    handleInputChange(item.inventoryID, e.target.value)
                  }
                  sx={{
                    width: 50,
                    '& .MuiInputBase-input': {
                      fontSize: 12,
                      py: 0.4,
                      textAlign: 'center'
                    }
                  }}
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Box>
          )
        })}
      </Box>

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
