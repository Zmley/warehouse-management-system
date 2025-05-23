import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartContext } from 'contexts/cart'
import InventoryListCard from './InventoryListCard'
import TaskInstruction from 'components/TaskInstruction'
import { useTaskContext } from 'contexts/task'
import { QrCode2 } from '@mui/icons-material'

const Cart = () => {
  const navigate = useNavigate()
  const { inventoriesInCar, setSelectedToUnload, sourceBin } = useCartContext()
  const { myTask, fetchMyTask } = useTaskContext()

  const defaultUnloadList = useMemo(() => {
    if (!inventoriesInCar.length) return []

    if (!myTask || myTask.productCode === 'ALL') {
      return inventoriesInCar.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: true
      }))
    }

    return inventoriesInCar.map(item => ({
      inventoryID: item.inventoryID,
      quantity:
        item.productCode === myTask.productCode
          ? myTask.quantity === 0
            ? item.quantity
            : myTask.quantity
          : item.quantity,
      selected: item.productCode === myTask.productCode
    }))
  }, [inventoriesInCar, myTask])

  const [inventoryListReadyToUnload, setInventoryListReadyToUnload] =
    useState(defaultUnloadList)

  useEffect(() => {
    fetchMyTask()
  }, [])

  useEffect(() => {
    setInventoryListReadyToUnload(defaultUnloadList)
  }, [defaultUnloadList])

  const handleQuantityChange = (inventoryID: string, newQuantity: number) => {
    setInventoryListReadyToUnload(prev =>
      prev.map(item =>
        item.inventoryID === inventoryID
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const handleSelectionChange = (inventoryID: string) => {
    setInventoryListReadyToUnload(prev =>
      prev.map(item =>
        item.inventoryID === inventoryID
          ? { ...item, selected: !item.selected }
          : item
      )
    )
  }

  const selectedTotalQuantity = inventoryListReadyToUnload
    .filter(item => item.selected)
    .reduce((sum, item) => sum + Number(item.quantity), 0)

  const overLimit =
    myTask?.productCode !== 'ALL' &&
    myTask?.quantity !== undefined &&
    myTask?.quantity !== 0 &&
    selectedTotalQuantity > myTask.quantity

  return (
    <Container maxWidth='sm' sx={{ pt: 1, pb: 10 }}>
      <Typography variant='h6' fontWeight='bold' textAlign='center' mb={2}>
        Cart
      </Typography>

      {myTask && (
        <Box mb={2}>
          <TaskInstruction />
        </Box>
      )}

      {/* <Typography variant='h6' fontWeight='bold' textAlign='center' mb={2}>
        Cart
      </Typography> */}

      <Card
        variant='outlined'
        sx={{
          borderRadius: 3,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <CardContent>
          {sourceBin && (
            <Box textAlign='center' mb={2}>
              <Typography variant='body2' fontWeight='bold'>
                Loaded From Bin
              </Typography>
              <Typography variant='subtitle1' color='primary'>
                {sourceBin}
              </Typography>
            </Box>
          )}

          <InventoryListCard
            taskType='Worker Self Performance'
            inventories={inventoriesInCar}
            selectedList={inventoryListReadyToUnload}
            onQuantityChange={handleQuantityChange}
            onSelectionChange={handleSelectionChange}
          />

          {overLimit && (
            <Typography
              color='error'
              fontSize={14}
              textAlign='center'
              mt={2}
              fontWeight='bold'
            >
              ❌ Selected quantity ({selectedTotalQuantity}) exceeds task limit
              ({myTask.quantity})
            </Typography>
          )}

          <Box mt={3}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() =>
                    navigate('/my-task/scan-qr', { state: { mode: 'load' } })
                  }
                  startIcon={<QrCode2 />}
                  sx={{
                    width: '100%',
                    height: 60,
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0px 3px 10px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#1e40af'
                    }
                  }}
                >
                  Load
                </Button>
              </Grid>

              <Grid item xs={6}>
                <Button
                  variant='contained'
                  color='secondary'
                  startIcon={<QrCode2 />}
                  disabled={overLimit}
                  onClick={() => {
                    const selectedToUnload = inventoryListReadyToUnload
                      .filter(item => item.selected)
                      .map(({ inventoryID, quantity }) => ({
                        inventoryID,
                        quantity
                      }))
                    setSelectedToUnload(selectedToUnload)
                    navigate('/my-task/scan-qr', {
                      state: {
                        mode: 'unload',
                        unloadProductList: selectedToUnload
                      }
                    })
                  }}
                  sx={{
                    width: '100%',
                    height: 60,
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0px 3px 10px rgba(0,0,0,0.08)',
                    '&:hover': {
                      backgroundColor: '#059669'
                    }
                  }}
                >
                  Unload
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Cart
