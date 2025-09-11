import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Tooltip,
  Drawer
} from '@mui/material'
import { useTaskContext } from 'contexts/task'
import { useCartContext } from 'contexts/cart'
import { useTask } from 'hooks/useTask'
import { useTranslation } from 'react-i18next'

const TaskInstruction: React.FC = () => {
  const { t } = useTranslation()
  const { myTask, setMyTask } = useTaskContext()
  const { inventoriesInCart, getMyCart } = useCartContext()
  const { cancelMyTask } = useTask()

  const [openCancelDrawer, setOpenCancelDrawer] = useState(false)

  if (!myTask) return null

  const hasCargo = inventoriesInCart.length > 0

  const handleCancel = async () => {
    try {
      await cancelMyTask(myTask.taskID)
      setMyTask(null)
      await getMyCart()
    } catch (err) {
      console.error('❌ Failed to cancel task', err)
    }
  }

  return (
    <>
      <Card
        variant='outlined'
        sx={{
          mb: 2,
          borderRadius: 2,
          backgroundColor: '#f5faff',
          boxShadow: '0 2px 4px #00000010',
          px: 1.5,
          py: 1
        }}
      >
        <CardContent sx={{ py: 0, '&:last-child': { pb: 0 } }}>
          <Grid container spacing={1}>
            <Grid item xs={12} textAlign='center'>
              <Typography
                variant='caption'
                fontSize={12}
                color='text.secondary'
              >
                {t('taskInstruction.sourceBin')}
              </Typography>

              {myTask.sourceBins?.length > 0 ? (
                <Box
                  display='grid'
                  gridTemplateColumns='repeat(auto-fit, minmax(120px, 1fr))'
                  gap={0.5}
                  mt={0.5}
                  justifyContent='center'
                >
                  {myTask.sourceBins.map((inv: any, index: number) => (
                    <Typography
                      key={index}
                      fontSize={13}
                      fontWeight={600}
                      textAlign='center'
                    >
                      {inv.bin?.binCode ?? '--'}: {inv.quantity ?? '--'}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography fontSize={13} fontWeight={600}>
                  --
                </Typography>
              )}
            </Grid>

            <Grid item xs={4} textAlign='center'>
              <Typography
                variant='caption'
                fontSize={12}
                color='text.secondary'
              >
                {t('taskInstruction.product')}
              </Typography>
              <Typography fontSize={13} fontWeight='bold'>
                {myTask.productCode || '--'}
              </Typography>
            </Grid>

            <Grid item xs={4} textAlign='center'>
              <Typography
                variant='caption'
                fontSize={12}
                color='text.secondary'
              >
                {t('taskInstruction.quantity')}
              </Typography>
              <Typography fontSize={13} fontWeight='bold'>
                {myTask.quantity === 0 ? 'ALL' : (myTask.quantity ?? '--')}
              </Typography>
            </Grid>

            <Grid item xs={4} textAlign='center'>
              <Typography
                variant='caption'
                fontSize={12}
                color='text.secondary'
              >
                {t('taskInstruction.targetBin')}
              </Typography>
              <Typography fontSize={13} fontWeight='bold'>
                {myTask.destinationBinCode || '--'}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.2 }} />

          <Box display='flex' justifyContent='flex-end' gap={1} flexWrap='wrap'>
            <Tooltip
              title={
                hasCargo
                  ? t('taskInstruction.cancelAndReturnTooltip')
                  : t('taskInstruction.cancelTooltip')
              }
            >
              <span>
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  onClick={() => setOpenCancelDrawer(true)}
                  sx={{
                    height: 28,
                    px: 1.5,
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                >
                  {hasCargo
                    ? t('taskInstruction.cancelAndReturnButton')
                    : t('taskInstruction.cancelButton')}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Drawer
        anchor='bottom'
        open={openCancelDrawer}
        onClose={() => setOpenCancelDrawer(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 3,
            height: 220
          }
        }}
      >
        <Typography textAlign='center' fontWeight='bold' fontSize={18} mb={2}>
          {t('taskInstruction.confirmCancelTitle')}
        </Typography>

        {hasCargo && (
          <Typography textAlign='center' mb={3} color='text.secondary'>
            {t('taskInstruction.confirmCancelSubtitle', {
              bin:
                myTask?.sourceBins
                  ?.map((inv: any) => inv.bin?.binCode)
                  .filter(Boolean)
                  .join(', ') || '--'
            })}
          </Typography>
        )}

        <Button
          variant='contained'
          color='error'
          fullWidth
          sx={{ height: 64, fontSize: 16, fontWeight: 600, borderRadius: 2 }}
          onClick={async () => {
            await handleCancel()
            setOpenCancelDrawer(false)
          }}
        >
          {t('taskInstruction.confirmNow')}
        </Button>
      </Drawer>
    </>
  )
}

export default TaskInstruction
