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
import InventoryListCard from './components/InventoryListCard'
import TaskInstruction from 'components/TaskInstruction'
import { useTaskContext } from 'contexts/task'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { ScanMode } from 'constants/index'
import { getSourceBinCode } from 'utils/Storages'

import EmptyBinPanel from './components/EmptyBinPanel'

const Cart = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { inventoriesInCart, setSelectedToUnload } = useCartContext()
  const { myTask, fetchMyTask } = useTaskContext()
  const { unloadCart } = useCart()

  const [confirmUnloadDrawer, setConfirmUnloadDrawer] = useState(false)
  const [confirmReturnDrawer, setConfirmReturnDrawer] = useState(false)

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

  const noSelectedItems =
    inventoryListReadyToUnload.filter(item => item.selected).length === 0

  const handleUnloadConfirm = async () => {
    const selectedToUnload = inventoryListReadyToUnload
      .filter(item => item.selected)
      .map(({ inventoryID, quantity }) => ({ inventoryID, quantity }))

    setSelectedToUnload(selectedToUnload)

    if (myTask?.destinationBinCode) {
      const result = await unloadCart(
        myTask.destinationBinCode,
        selectedToUnload
      )
      if (result?.success) {
        navigate('/success')
      } else {
        console.error('Unload failed:', result?.error)
      }
    } else {
      navigate('/my-task/scan-QRCode', {
        state: {
          mode: ScanMode.UNLOAD,
          unloadProductList: selectedToUnload
        }
      })
    }
  }

  const handleReturnConfirm = async () => {
    const selectedToUnload = inventoryListReadyToUnload
      .filter(item => item.selected)
      .map(({ inventoryID, quantity }) => ({ inventoryID, quantity }))

    const binCode = getSourceBinCode() || 'emptyCart'
    const result = await unloadCart(binCode, selectedToUnload)

    if (result?.success) {
      navigate('/success')
    } else {
      console.error('Return failed:', result?.error)
    }
  }

  return (
    <Box
      display='flex'
      flexDirection='column'
      height='100vh'
      overflow='hidden'
      bgcolor='#f5f5f5'
    >
      <Box flex={1} overflow='auto' px={2} pt={1.5}>
        {!myTask && <EmptyBinPanel />}

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
              onReturnClick={() => setConfirmReturnDrawer(true)}
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
                    onClick={() =>
                      navigate('/my-task/scan-QRCode', {
                        state: { mode: ScanMode.LOAD }
                      })
                    }
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
                    disabled={overLimit || noSelectedItems}
                    onClick={() => {
                      const selectedToUnload = inventoryListReadyToUnload
                        .filter(item => item.selected)
                        .map(({ inventoryID, quantity }) => ({
                          inventoryID,
                          quantity
                        }))

                      setSelectedToUnload(selectedToUnload)

                      if (myTask?.destinationBinCode) {
                        setConfirmUnloadDrawer(true)
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
                      <Typography fontWeight={600} fontSize={16}>
                        {t('cart.unloadDirectTo')}
                      </Typography>
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
        open={confirmUnloadDrawer}
        onClose={() => setConfirmUnloadDrawer(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 3,
            height: 250
          }
        }}
      >
        <Typography textAlign='center' mb={2} fontWeight='bold'>
          {t('cart.confirmUnloadTo')}
        </Typography>
        <Typography textAlign='center' mb={2} fontSize={18}>
          {myTask?.destinationBinCode}
        </Typography>
        <Button
          variant='contained'
          color='success'
          fullWidth
          sx={{ height: 100, borderRadius: 2, fontWeight: 600, fontSize: 16 }}
          onClick={async () => {
            await handleUnloadConfirm()
            setConfirmUnloadDrawer(false)
          }}
        >
          {t('cart.confirmNow')}
        </Button>
      </Drawer>

      <Drawer
        anchor='bottom'
        open={confirmReturnDrawer}
        onClose={() => setConfirmReturnDrawer(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 3,
            height: 250
          }
        }}
      >
        <Typography textAlign='center' mb={2} fontWeight='bold'>
          {getSourceBinCode()
            ? t('cart.confirmReturnToSource')
            : t('cart.confirmReturnToEmptyCart')}
        </Typography>

        <Typography textAlign='center' mb={2} fontSize={18}>
          {getSourceBinCode() === 'staging-area'
            ? t('cart.stagingArea')
            : getSourceBinCode()}
        </Typography>

        <Button
          variant='contained'
          color='primary'
          fullWidth
          sx={{ height: 100, borderRadius: 2, fontWeight: 600, fontSize: 16 }}
          onClick={async () => {
            await handleReturnConfirm()
            setConfirmReturnDrawer(false)
          }}
        >
          {t('cart.confirm')}
        </Button>
      </Drawer>
    </Box>
  )
}

export default Cart
