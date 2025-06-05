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
import { useTranslation } from 'react-i18next'
import DocumentScanner from '@mui/icons-material/DocumentScanner'

const Cart = () => {
  const { t } = useTranslation()
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
    <Container maxWidth='sm' sx={{ pt: 0, pb: 10 }}>
      {myTask && (
        <Box mb={2}>
          <TaskInstruction />
        </Box>
      )}

      <Card
        variant='outlined'
        sx={{
          borderRadius: 3,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <CardContent>
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
              ❌{' '}
              {t('cart.overLimit', {
                selected: selectedTotalQuantity,
                limit: myTask.quantity
              })}
            </Typography>
          )}

          <Box mt={3}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box display='flex' flexDirection='column' height='100%'>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() =>
                      navigate('/my-task/scan-QRCode', {
                        state: { mode: 'load' }
                      })
                    }
                    startIcon={<QrCode2 />}
                    sx={{
                      mb: 1,
                      flex: 1,
                      fontWeight: 600,
                      fontSize: 14,
                      textTransform: 'none',
                      borderRadius: 2,
                      height: 50
                    }}
                  >
                    {t('cart.loadByBin')}
                  </Button>

                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() => navigate('/my-task/scan-barCode')}
                    startIcon={
                      <DocumentScanner sx={{ transform: 'rotate(90deg)' }} />
                    }
                    sx={{
                      flex: 1,
                      fontWeight: 600,
                      fontSize: 14,
                      textTransform: 'none',
                      borderRadius: 2,
                      height: 50
                    }}
                  >
                    {t('cart.loadByProduct')}
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Button
                  variant='contained'
                  color='success'
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
                    navigate('/my-task/scan-QRCode', {
                      state: {
                        mode: 'unload',
                        unloadProductList: selectedToUnload
                      }
                    })
                  }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: 110,
                    fontWeight: 600,
                    fontSize: 16,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  {t('cart.unload')}
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
