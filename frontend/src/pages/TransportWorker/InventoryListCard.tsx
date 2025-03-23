import React from 'react'
import { Box, TextField, Checkbox, Typography } from '@mui/material'
import { InventoryItem } from '../../types/inventory'

interface Props {
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
  inventories,
  selectedList,
  onQuantityChange,
  onCheckboxChange
}) => {
  return (
    <>
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
    </>
  )
}

export default InventoryListCard
