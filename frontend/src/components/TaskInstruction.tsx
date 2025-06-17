import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Tooltip
} from '@mui/material'
import { useTaskContext } from 'contexts/task'
import { useCartContext } from 'contexts/cart'
import { useTask } from 'hooks/useTask'
import { useCart } from 'hooks/useCart'
import { useTranslation } from 'react-i18next'

const TaskInstruction: React.FC = () => {
  const { t } = useTranslation()
  const { myTask, setMyTask } = useTaskContext()
  const { inventoriesInCar, getMyCart } = useCartContext()
  const { cancelMyTask, releaseTask } = useTask()
  const { loadCart } = useCart()

  if (!myTask) return null

  const hasCargo = inventoriesInCar.length > 0
  const firstSourceBin = myTask.sourceBins?.[0]
  const binCode =
    typeof firstSourceBin === 'object' &&
    firstSourceBin !== null &&
    'bin' in firstSourceBin
      ? (firstSourceBin as any).bin?.binCode
      : (firstSourceBin as any)?.binCode
  const isAisleTask =
    typeof binCode === 'string' && binCode.startsWith('AISLE-')

  const handleCancel = async () => {
    try {
      await cancelMyTask(myTask.taskID)
      setMyTask(null)
    } catch (err) {
      console.error('❌ Failed to cancel task', err)
    }
  }

  const handleRelease = async () => {
    try {
      await releaseTask(myTask.taskID)
      await getMyCart()
      setMyTask(null)
    } catch (err) {
      console.error('❌ Failed to release task', err)
    }
  }

  const handleLoadAisleTask = async () => {
    if (!binCode) return
    try {
      const res = await loadCart({ binCode })
      if (res.success) {
        console.log('✅ Loaded successfully from aisle bin')
      }
    } catch (err) {
      console.error('❌ Failed to load from aisle bin', err)
    }
  }

  return (
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
            <Typography variant='caption' fontSize={12} color='text.secondary'>
              {t('taskInstruction.sourceBin')}
            </Typography>
            <Box sx={{ fontSize: 13, fontWeight: 600, mt: 0.5 }}>
              {myTask.sourceBins?.length > 0
                ? myTask.sourceBins.map((inv: any, index: number) => (
                    <div key={index} style={{ lineHeight: 1.3 }}>
                      {inv.bin?.binCode ?? '--'}: {inv.quantity ?? '--'}
                    </div>
                  ))
                : '--'}
            </Box>
          </Grid>

          <Grid item xs={4} textAlign='center'>
            <Typography variant='caption' fontSize={12} color='text.secondary'>
              {t('taskInstruction.product')}
            </Typography>
            <Typography fontSize={13} fontWeight='bold'>
              {myTask.productCode || '--'}
            </Typography>
          </Grid>

          <Grid item xs={4} textAlign='center'>
            <Typography variant='caption' fontSize={12} color='text.secondary'>
              {t('taskInstruction.quantity')}
            </Typography>
            <Typography fontSize={13} fontWeight='bold'>
              {myTask.quantity === 0 ? 'ALL' : myTask.quantity ?? '--'}
            </Typography>
          </Grid>

          <Grid item xs={4} textAlign='center'>
            <Typography variant='caption' fontSize={12} color='text.secondary'>
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
                ? t('taskInstruction.cannotCancelAfterLoad')
                : t('taskInstruction.cancelTooltip')
            }
          >
            <span>
              <Button
                variant='outlined'
                color='error'
                size='small'
                disabled={hasCargo}
                onClick={handleCancel}
                sx={{
                  height: 28,
                  px: 1.5,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 1
                }}
              >
                {t('taskInstruction.cancel')}
              </Button>
            </span>
          </Tooltip>

          <Tooltip
            title={
              hasCargo
                ? t('taskInstruction.releaseTooltip')
                : t('taskInstruction.mustLoadFirst')
            }
          >
            <span>
              <Button
                variant='contained'
                color='success'
                size='small'
                disabled={!hasCargo}
                onClick={handleRelease}
                sx={{
                  height: 28,
                  px: 1.5,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 1
                }}
              >
                {t('taskInstruction.release')}
              </Button>
            </span>
          </Tooltip>

          {isAisleTask && !hasCargo && (
            <Tooltip title={t('taskInstruction.loadTooltip')}>
              <span>
                <Button
                  variant='contained'
                  color='primary'
                  size='small'
                  onClick={handleLoadAisleTask}
                  sx={{
                    height: 28,
                    px: 1.5,
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                >
                  {t('taskInstruction.load')}
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default TaskInstruction
