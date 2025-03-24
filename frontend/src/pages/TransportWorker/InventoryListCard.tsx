import React from 'react'
import {
  Box,
  TextField,
  Checkbox,
  Typography,
  Chip,
  Divider,
  Snackbar,
  Alert
} from '@mui/material'
import { InventoryItem } from '../../types/inventory'

interface Props {
  taskID: string
  sourceBin: string
  targetBin?: string
  totalQuantity: number
  statusPicked: boolean
  inventories: InventoryItem[]
  selectedList: {
    inventoryID: string
    quantity: number | string // 支持 "" 临时状态
    selected: boolean
  }[]
  onQuantityChange: (inventoryID: string, newQuantity: number) => void
  onCheckboxChange: (inventoryID: string) => void
}

const InventoryListCard: React.FC<Props> = ({
  taskID,
  sourceBin,
  targetBin,
  totalQuantity,
  statusPicked,
  inventories,
  selectedList,
  onQuantityChange,
  onCheckboxChange
}) => {
  const [errorOpen, setErrorOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  const handleInputChange = (inventoryID: string, value: string) => {
    const sanitized = value.replace(/^0+(?!$)/, '') // 去除前导 0，但保留单独的 '0'

    // 如果输入为空，默认视为 0
    const numericValue = sanitized === '' ? 0 : Number(sanitized)

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
      {/* 🧾 Top Task Info Section */}
      <Box
        sx={{
          backgroundColor: '#f0f4f7',
          borderRadius: 3,
          p: 2,
          mb: 2
        }}
      >
        <Typography fontWeight='bold'>Task ID # {taskID}</Typography>

        <Box display='flex' justifyContent='space-between' mt={1}>
          <Box>
            <Typography variant='caption' fontWeight='bold'>
              Source Bin
            </Typography>
            <Typography fontSize={18} fontWeight='bold'>
              {sourceBin}
            </Typography>
          </Box>
          <Box>
            <Typography variant='caption' fontWeight='bold'>
              Target Bin
            </Typography>
            <Typography fontSize={18} fontWeight='bold'>
              {targetBin || '--'}
            </Typography>
          </Box>
        </Box>

        {/* 状态按钮 */}
        <Box display='flex' justifyContent='space-between' mt={2}>
          <Chip
            label='● Task Picked'
            color={statusPicked ? 'success' : 'default'}
            variant={statusPicked ? 'filled' : 'outlined'}
            sx={{ borderRadius: '16px' }}
          />
          <Chip
            label='● Task Delivered'
            color='default'
            variant='outlined'
            sx={{ borderRadius: '16px' }}
          />
        </Box>
      </Box>

      {/* Divider */}
      <Divider sx={{ mb: 2 }} />

      {/* 📦 Product List */}
      {selectedList.map(item => {
        const inv = inventories.find(i => i.inventoryID === item.inventoryID)
        return (
          <Box
            key={item.inventoryID}
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              borderRadius: 2,
              backgroundColor: item.selected ? '#e9f1f7' : 'transparent'
            }}
          >
            <Box>
              <Typography fontSize={14} fontWeight='bold'>
                #{inv?.productCode}
              </Typography>
              <Typography fontSize={12}>
                Total <strong>{inv?.quantity}</strong> &nbsp;&nbsp;&nbsp;Offload
              </Typography>
            </Box>

            <TextField
              size='small'
              type='number'
              value={item.quantity}
              sx={{ width: 70 }}
              disabled={item.selected}
              onChange={e =>
                handleInputChange(item.inventoryID, e.target.value)
              }
              inputProps={{ min: 0 }}
            />

            <Checkbox
              checked={item.selected}
              onChange={() => onCheckboxChange(item.inventoryID)}
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
