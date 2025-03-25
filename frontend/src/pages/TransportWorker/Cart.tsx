import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Snackbar,
  Alert
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCargoContext } from '../../contexts/cart'
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
  const [openToast, setOpenToast] = useState(false)

  useEffect(() => {
    if (inventories.length === 0) {
      setIsSuccess(true)
      setOpenToast(true)

      const timeout = setTimeout(() => {
        navigate('/')
      }, 3000)

      return () => clearTimeout(timeout)
    } else {
      const defaultList = inventories.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: true
      }))
      setSelectedList(defaultList)
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

  return (
    <Container maxWidth='sm'>
      {isSuccess && (
        <Snackbar
          open={openToast}
          autoHideDuration={3000}
          onClose={() => setOpenToast(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999
          }}
        >
          <Alert
            severity='success'
            onClose={() => setOpenToast(false)}
            sx={{
              width: 'auto',
              borderRadius: 3,
              backgroundColor: '#f0f6fb',
              textAlign: 'center',
              padding: '10px 20px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: 4
            }}
          >
            <CheckCircleIcon
              sx={{ fontSize: 20, marginRight: 1, color: '#2f7abf' }}
            />
            Offload succeeded
          </Alert>
        </Snackbar>
      )}

      {!isSuccess && (
        <>
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
        </>
      )}
    </Container>
  )
}

export default InProcessTaskPage
