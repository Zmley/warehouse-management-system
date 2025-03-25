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
import { useProductContext } from '../../contexts/cart'
import InventoryListCard from './InventoryListCard'

const InProcessTaskPage = () => {
  const navigate = useNavigate()
  const { inventories, refreshProductStatus, setSelectedForUnload } =
    useProductContext()

  const [selectedList, setSelectedList] = useState<
    { inventoryID: string; quantity: number; selected: boolean }[]
  >([])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (inventories.length === 0) {
      setIsLoading(false)

      setTimeout(() => {
        navigate('/success')
      })
    } else {
      const defaultList = inventories.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: true
      }))
      setSelectedList(defaultList)
      setIsLoading(false)
    }
  }, [inventories, navigate])

  const handleQuantityChange = (inventoryID: string, newQuantity: number) => {
    setSelectedList(prev =>
      prev.map(item =>
        item.inventoryID === inventoryID
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const handleCheckboxChange = (inventoryID: string) => {
    setSelectedList(prev =>
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
            taskID=''
            sourceBin=''
            targetBin=''
            totalQuantity={2}
            statusPicked={true}
            inventories={inventories}
            selectedList={selectedList}
            onQuantityChange={handleQuantityChange}
            onCheckboxChange={handleCheckboxChange}
          />

          {/* Go to Scan Page */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={() => {
                const selectedToUnload = selectedList
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

export default InProcessTaskPage
