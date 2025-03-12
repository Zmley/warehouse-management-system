import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  TextField
} from '@mui/material'
import { InventoryItem } from '../types/inventoryTypes'

interface InventoryTableProps {
  inventory: InventoryItem[]
  onDeleteSuccess: (id: string) => void
  onAddSuccess: (item: Omit<InventoryItem, 'id'>) => void
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  onDeleteSuccess,
  onAddSuccess
}) => {
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false) // ✅ 正确使用
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    warehouse_code: '',
    bin_code: '',
    product_code: '',
    quantity: 0,
    bin_qr_code: ''
  })

  const handleEdit = (id: string) => {
    navigate(`/inventory/edit/${id}`)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await onDeleteSuccess(deleteId)
      setDeleteId(null)
    }
  }

  const handleAddItem = async () => {
    await onAddSuccess(newItem)
    setOpenAddDialog(false) 
    setNewItem({
      warehouse_code: '',
      bin_code: '',
      product_code: '',
      quantity: 0,
      bin_qr_code: ''
    })
  }

  return (
    <>
      <Button
        variant='contained'
        color='success'
        onClick={() => setOpenAddDialog(true)} 
        sx={{ mb: 2 }}
      >
        ➕ Add Item
      </Button>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>
                <strong>Warehouse Code</strong>
              </TableCell>
              <TableCell>
                <strong>Bin Code</strong>
              </TableCell>
              <TableCell>
                <strong>Product Code</strong>
              </TableCell>
              <TableCell>
                <strong>Quantity</strong>
              </TableCell>
              <TableCell>
                <strong>QR Code</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.warehouse_code}</TableCell>
                <TableCell>{item.bin_code}</TableCell>
                <TableCell>{item.product_code}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.bin_qr_code}</TableCell>{' '}
                <TableCell>
                  <Button
                    variant='contained'
                    color='primary'
                    size='small'
                    sx={{ mr: 1 }}
                    onClick={() => handleEdit(item.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant='contained'
                    color='error'
                    size='small'
                    onClick={() => setDeleteId(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Are you sure you want to delete this item?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error'>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        {' '}
        <DialogTitle>➕ Add New Inventory Item</DialogTitle>
        <DialogContent>
          <TextField
            label='Warehouse Code'
            fullWidth
            margin='dense'
            value={newItem.warehouse_code}
            onChange={e =>
              setNewItem({ ...newItem, warehouse_code: e.target.value })
            }
          />
          <TextField
            label='Bin Code'
            fullWidth
            margin='dense'
            value={newItem.bin_code}
            onChange={e => setNewItem({ ...newItem, bin_code: e.target.value })}
          />
          <TextField
            label='Product Code'
            fullWidth
            margin='dense'
            value={newItem.product_code}
            onChange={e =>
              setNewItem({ ...newItem, product_code: e.target.value })
            }
          />
          <TextField
            label='Quantity'
            type='number'
            fullWidth
            margin='dense'
            value={newItem.quantity}
            onChange={e =>
              setNewItem({ ...newItem, quantity: Number(e.target.value) })
            }
          />
          <TextField
            label='QR Code URL'
            fullWidth
            margin='dense'
            value={newItem.bin_qr_code}
            onChange={e =>
              setNewItem({ ...newItem, bin_qr_code: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleAddItem} color='primary'>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default InventoryTable
