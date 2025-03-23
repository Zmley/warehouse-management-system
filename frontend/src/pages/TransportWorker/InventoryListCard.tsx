import React from 'react'
import {
  Box,
  TextField,
  Checkbox,
  Typography,
  Chip,
  Divider
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
    quantity: number
    selected: boolean
  }[]
  onQuantityChange: (inventoryID: string, newQuantity: number) => void
  onCheckboxChange: (inventoryID: string) => void
}

const InventoryListCard: React.FC<Props> = ({
  taskID,
  sourceBin,
  targetBin,
  //   totalQuantity,
  statusPicked,
  inventories,
  selectedList,
  onQuantityChange,
  onCheckboxChange
}) => {
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
            {/* <Typography variant='caption' fontWeight='bold'>
              Quantity
            </Typography>
            <Typography fontSize={18} fontWeight='bold'>
              {totalQuantity}
            </Typography> */}
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
            color='success'
            variant='filled'
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
              disabled={item.selected} // ✅ 勾选后不可编辑
              onChange={e =>
                onQuantityChange(item.inventoryID, Number(e.target.value))
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
    </Box>
  )
}

export default InventoryListCard
