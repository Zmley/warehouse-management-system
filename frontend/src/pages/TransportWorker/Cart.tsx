import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Drawer
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
import { useCart } from 'hooks/useCart'
import { ScanMode } from 'constant/index'

const Cart = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { inventoriesInCart, setSelectedToUnload } = useCartContext()
  const { myTask, fetchMyTask } = useTaskContext()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { unloadCart } = useCart()

  const defaultUnloadList = useMemo(() => {
    if (!inventoriesInCart.length) return []

    if (!myTask || myTask.productCode === 'ALL') {
      return inventoriesInCart.map(item => ({
        inventoryID: item.inventoryID,
        quantity: item.quantity,
        selected: true
      }))
    }

    return inventoriesInCart.map(item => ({
      inventoryID: item.inventoryID,
      quantity:
        item.productCode === myTask.productCode
          ? myTask.quantity === 0
            ? item.quantity
            : myTask.quantity
          : item.quantity,
      selected: item.productCode === myTask.productCode
    }))
  }, [inventoriesInCart, myTask])

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
    <Box
      display='flex'
      flexDirection='column'
      height='100vh'
      overflow='hidden'
      bgcolor='#f5f5f5'
    >
      <Box flex={1} overflow='auto' px={2} pt={0}>
        {myTask && (
          <Box mb={2}>
            <TaskInstruction />
          </Box>
        )}

        <Card
          variant='outlined'
          sx={{
            borderRadius: 3,
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px #0000000A'
          }}
        >
          <CardContent>
            <InventoryListCard
              taskType='Worker Self Performance'
              inventories={inventoriesInCart}
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

            <Box mt={1} mb={0}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() => setDrawerOpen(true)}
                    sx={{
                      width: '100%',
                      height: 80,
                      fontWeight: 600,
                      fontSize: 16,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                  >
                    {t('cart.startLoad')}
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    variant='contained'
                    color='success'
                    disabled={overLimit}
                    onClick={async () => {
                      const selectedToUnload = inventoryListReadyToUnload
                        .filter(item => item.selected)
                        .map(({ inventoryID, quantity }) => ({
                          inventoryID,
                          quantity
                        }))
                      setSelectedToUnload(selectedToUnload)

                      if (myTask?.destinationBinCode) {
                        await unloadCart(
                          myTask.destinationBinCode,
                          selectedToUnload
                        )
                      } else {
                        navigate('/my-task/scan-QRCode', {
                          state: {
                            mode: ScanMode.UNLOAD,
                            unloadProductList: selectedToUnload
                          }
                        })
                      }
                    }}
                    sx={{
                      width: '100%',
                      height: 80,
                      fontWeight: 600,
                      fontSize: 16,
                      textTransform: 'none',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      lineHeight: 1.2,
                      px: 1
                    }}
                  >
                    {myTask?.destinationBinCode ? (
                      <>
                        <Typography fontWeight={600} fontSize={16}>
                          {t('cart.unloadDirectTo')}
                        </Typography>
                        <Typography fontWeight={600} fontSize={16}>
                          {myTask.destinationBinCode}
                        </Typography>
                      </>
                    ) : (
                      <Typography fontWeight={600} fontSize={16}>
                        {t('cart.unload')}
                      </Typography>
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Drawer
        anchor='bottom'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, p: 2 }
        }}
      >
        <Typography variant='h6' textAlign='center' mb={2}>
          {t('cart.chooseLoadMode')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={() => {
                navigate('/my-task/scan-QRCode', { state: { mode: 'load' } })
                setDrawerOpen(false)
              }}
              startIcon={<QrCode2 />}
              sx={{
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 2,
                height: 50
              }}
            >
              {t('cart.loadByBin')}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={() => {
                navigate('/my-task/scan-barCode')
                setDrawerOpen(false)
              }}
              startIcon={
                <DocumentScanner sx={{ transform: 'rotate(90deg)' }} />
              }
              sx={{
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 2,
                height: 50
              }}
            >
              {t('cart.loadByProduct')}
            </Button>
          </Grid>
        </Grid>
      </Drawer>
    </Box>
  )
}

export default Cart
