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
import { useCargoContext } from '../../contexts/cargo'
import InventoryListCard from './InventoryListCard'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const InProcessTaskPage = () => {
  const navigate = useNavigate()
  const { inventories, refreshCargoStatus, setSelectedForUnload } =
    useCargoContext()
  const [selectedList, setSelectedList] = useState<
    { inventoryID: string; quantity: number; selected: boolean }[]
  >([])

  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (inventories.length === 0) {
      setIsSuccess(true)
      const timeout = setTimeout(() => {
        navigate('/')
      }, 3000)
      return () => clearTimeout(timeout)
    }

    const defaultList = inventories.map(item => ({
      inventoryID: item.inventoryID,
      quantity: item.quantity,
      selected: true
    }))
    setSelectedList(defaultList)
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

  if (isSuccess) {
    return (
      <Container maxWidth='sm'>
        <Card
          sx={{
            mt: 10,
            py: 6,
            backgroundColor: '#f0f6fb',
            textAlign: 'center',
            boxShadow: 4,
            borderRadius: 3
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60, color: '#2f7abf' }} />
          <Typography mt={2} fontWeight='bold'>
            Offload succeeded
          </Typography>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth='sm'>
      <Typography
        variant='h6'
        sx={{ fontWeight: 'bold', textAlign: 'center', my: 2 }}
      >
        📦 Items Currently in Cart
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

          {/* Cancel */}
          <Button
            variant='outlined'
            fullWidth
            onClick={() => navigate('/')}
            sx={{ mt: 1.5, borderRadius: '12px', fontSize: 14 }}
          >
            Cancel ❌
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}

export default InProcessTaskPage
