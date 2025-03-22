import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  Checkbox,
  CircularProgress
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCargoContext } from '../../contexts/cargo'

interface InventoryItem {
  inventoryID: string
  productCode: string
  quantity: number
}

const InProcessTaskPage = () => {
  const navigate = useNavigate()
  const { inventories, refreshCargoStatus, setSelectedForUnload } =
    useCargoContext()
  const [selectedList, setSelectedList] = useState<
    { inventoryID: string; quantity: number; selected: boolean }[]
  >([])

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (inventories.length === 0) {
      navigate('/')
      return
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
              selected: !item.selected,
              quantity: !item.selected
                ? inventories.find(i => i.inventoryID === item.inventoryID)
                    ?.quantity || 0
                : item.quantity
            }
          : item
      )
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
          {/* Inventory Items */}
          {selectedList.map(item => {
            const inv = inventories.find(
              i => i.inventoryID === item.inventoryID
            )
            return (
              <Box
                key={item.inventoryID}
                sx={{
                  mt: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography fontSize={14} fontWeight='bold'>
                    #{inv?.productCode}
                  </Typography>
                  <Typography fontSize={12}>
                    Total <strong>{inv?.quantity}</strong>
                  </Typography>
                </Box>

                <TextField
                  size='small'
                  type='number'
                  value={item.quantity}
                  sx={{ width: 80 }}
                  disabled={!item.selected}
                  onChange={e =>
                    handleQuantityChange(
                      item.inventoryID,
                      Number(e.target.value)
                    )
                  }
                />
                <Checkbox
                  checked={item.selected}
                  onChange={() => handleCheckboxChange(item.inventoryID)}
                />
              </Box>
            )
          })}

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
              📷 Go to Scan Page
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
