import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartContext } from '../../contexts/cart'
import InventoryListCard from './InventoryListCard'
import TaskInstruction from '../../components/TaskInstruction'
import { useTaskContext } from '../../contexts/task'

const Cart = () => {
  const navigate = useNavigate()
  const { inventoriesInCar, setSelectedToUnload } = useCartContext()

  const { myTask, fetchMyTask } = useTaskContext()

  const [inventoryListReadyToUnload, setInventoryListReadyToUnload] = useState<
    { inventoryID: string; quantity: number; selected: boolean }[]
  >([])

  if (inventoriesInCar.length > 0 && inventoryListReadyToUnload.length === 0) {
    let defaultInventoryListReadyToUnload

    if (!myTask || myTask.productCode === 'ALL') {
      defaultInventoryListReadyToUnload = inventoriesInCar.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: true
      }))
    } else {
      defaultInventoryListReadyToUnload = inventoriesInCar.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: item.productCode === myTask.productCode
      }))
    }

    setInventoryListReadyToUnload(defaultInventoryListReadyToUnload)
  }

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
          ? {
              ...item,
              selected: !item.selected
            }
          : item
      )
    )
  }
  useEffect(() => {
    fetchMyTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Container maxWidth='sm'>
      {myTask?.taskID && <TaskInstruction />}
      <Typography
        variant='h6'
        sx={{ fontWeight: 'bold', textAlign: 'center', my: 2 }}
      >
        Items Currently in Cart
      </Typography>

      <Card
        variant='outlined'
        sx={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}
      >
        <CardContent>
          <InventoryListCard
            taskType='Woker Sefl Perfomance'
            inventories={inventoriesInCar}
            selectedList={inventoryListReadyToUnload}
            onQuantityChange={handleQuantityChange}
            onSelectionChange={handleSelectionChange}
          />

          {/* Go to Scan Page */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={() => {
                const selectedToUnload = inventoryListReadyToUnload
                  .filter(item => item.selected)
                  .map(({ inventoryID, quantity }) => ({
                    inventoryID,
                    quantity
                  }))

                setSelectedToUnload(selectedToUnload)

                navigate('scan-qr')
              }}
              sx={{ borderRadius: '12px', py: 1.2 }}
            >
              Scan to unload
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Cart
