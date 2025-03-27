import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartContext } from '../../contexts/cart'
import InventoryListCard from '../../components/InventoryListCard'
import { usePendingTaskContext } from '../../contexts/pendingTask'
import { useBinCodeContext } from '../../contexts/binCode'

const Cart = () => {
  const navigate = useNavigate()
  const { inProcessTask, fetchInProcessTask } = usePendingTaskContext()
  const { setDestinationBinCode } = useBinCodeContext()
  const { inventoryListInCar, setSelectedForUnload, justUnloadedSuccess } =
    useCartContext()

  const [inventoryListReadyToUnload, setInventoryListReadyToUnload] = useState<
    { inventoryID: string; quantity: number; selected: boolean }[]
  >([])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const prepareCart = async () => {
      if (inventoryListInCar.length > 0 && !inProcessTask) {
        await fetchInProcessTask()
      }
    }
    prepareCart()
  }, [inventoryListInCar])

  useEffect(() => {
    if (inventoryListInCar.length === 0 && justUnloadedSuccess) {
      setIsLoading(false)
      setTimeout(() => {
        navigate('/success')
      }, 500)
      return
    }

    let defaultList

    if (inProcessTask) {
      if (inProcessTask.productCode === 'ALL') {
        defaultList = inventoryListInCar.map(item => ({
          inventoryID: item.inventoryID,
          quantity: item.quantity,
          selected: true
        }))
      } else {
        defaultList = inventoryListInCar.map(item => ({
          inventoryID: item.inventoryID,
          quantity: item.quantity,
          selected: item.productCode === inProcessTask.productCode
        }))
      }

      if (inProcessTask.destinationBinCode?.length) {
        setDestinationBinCode(inProcessTask.destinationBinCode[0])
      }
    } else {
      defaultList = inventoryListInCar.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: true
      }))
    }

    setInventoryListReadyToUnload(defaultList)
    setIsLoading(false)
  }, [inventoryListInCar, inProcessTask, justUnloadedSuccess])

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

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Container maxWidth='sm'>
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
            taskID={inProcessTask?.taskID || ''}
            statusPicked={true}
            inventories={inventoryListInCar}
            selectedList={inventoryListReadyToUnload}
            onQuantityChange={handleQuantityChange}
            onSelectionChange={handleSelectionChange}
          />

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

                setSelectedForUnload(selectedToUnload)
                navigate('/scan-qr')
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
