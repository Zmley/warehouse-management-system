import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { usePickerTasks } from 'hooks/usePickerTask'
import { TaskCategoryEnum } from 'constant/index'
import { useTranslation } from 'react-i18next'

interface Props {
  status: TaskCategoryEnum
}

const TaskListCard: React.FC<Props> = ({ status }) => {
  const { t } = useTranslation()
  const { cancelTask, tasks, fetchTasks } = usePickerTasks()

  const [hasFetched, setHasFetched] = useState(false)
  const [isLoadingTaskID, setIsLoadingTaskID] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTasks()
        setHasFetched(true)
      } catch (err: any) {
        setError(err.message || 'Error fetching tasks')
        setOpen(true)
      }
    }

    fetchData()
  }, [])

  const handleManualRefresh = async () => {
    try {
      await fetchTasks()
    } catch (err: any) {
      setError(err.message || 'Error refreshing tasks')
      setOpen(true)
    }
  }

  const handleCancel = async (taskID: string) => {
    setIsLoadingTaskID(taskID)
    try {
      const result = await cancelTask(taskID)
      if (result) {
        await fetchTasks()
      } else {
        setError(t('taskListCard.cancelFailed'))
        setOpen(true)
      }
    } catch (err: any) {
      setError(err.message || t('taskListCard.cancelFailed'))
      setOpen(true)
    } finally {
      setIsLoadingTaskID(null)
    }
  }

  const filteredTasks = tasks.filter(task => task.status === status)

  return (
    <PullToRefresh
      onRefresh={handleManualRefresh}
      refreshingContent={
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={28} thickness={5} />
          <Typography variant='caption' display='block' sx={{ mt: 1 }}>
            {t('taskListCard.refreshing')}
          </Typography>
        </Box>
      }
    >
      <Box p={2} pb={10}>
        {!hasFetched ? (
          <Box display='flex' justifyContent='center' mt={6}>
            <CircularProgress />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Typography color='text.secondary' textAlign='center'>
            {t('taskListCard.empty', { status })}
          </Typography>
        ) : (
          filteredTasks.map(task => (
            <Card
              key={task.taskID}
              variant='outlined'
              sx={{
                mb: 3,
                borderRadius: 3,
                backgroundColor: '#eff6ff',
                border: '1.5px solid #2563eb',
                boxShadow: '0 2px 6px #0000000D'
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} textAlign='center'>
                    <Typography variant='caption' color='text.secondary'>
                      {t('taskList.sourceBin')}
                    </Typography>
                    <Box sx={{ fontWeight: 'bold', fontSize: 15, mt: 0.5 }}>
                      {task.sourceBins && task.sourceBins.length > 0 ? (
                        task.sourceBins
                          .map((inv: any) => inv.bin?.binCode)
                          .filter(Boolean)
                          .join(' / ')
                      ) : (
                        <Box
                          display='flex'
                          justifyContent='center'
                          alignItems='center'
                          gap={0.5}
                        >
                          <Typography
                            fontSize={14}
                            fontWeight='medium'
                            sx={{ color: '#d32f2f' }}
                          >
                            {t('taskList.outOfStock')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={4} textAlign='center'>
                    <Typography variant='caption' color='text.secondary'>
                      {t('taskList.product')}
                    </Typography>
                    <Typography fontWeight='bold' fontSize={14}>
                      {task.productCode}
                    </Typography>
                  </Grid>

                  <Grid item xs={4} textAlign='center'>
                    <Typography variant='caption' color='text.secondary'>
                      {t('taskList.quantity')}
                    </Typography>
                    <Typography fontWeight='bold' fontSize={14}>
                      {task.quantity || 'ALL'}
                    </Typography>
                  </Grid>

                  <Grid item xs={4} textAlign='center'>
                    <Typography variant='caption' color='text.secondary'>
                      {t('taskList.targetBin')}
                    </Typography>
                    <Typography fontWeight='bold' fontSize={14}>
                      {task.destinationBinCode || '--'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontSize={12}
                  >
                    {t('taskList.createDate')}:{' '}
                    {new Date(task.createdAt).toLocaleString()}
                  </Typography>

                  {status === 'PENDING' && (
                    <Button
                      variant='contained'
                      color='error'
                      onClick={() => handleCancel(task.taskID)}
                      disabled={isLoadingTaskID === task.taskID}
                      sx={{
                        fontSize: 11,
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        minHeight: 30
                      }}
                    >
                      {isLoadingTaskID === task.taskID
                        ? t('taskListCard.cancelling')
                        : t('taskListCard.cancel')}
                    </Button>
                  )}

                  {status === 'COMPLETED' && (
                    <Typography
                      fontWeight='bold'
                      fontSize={12}
                      color='success.main'
                    >
                      {t('taskListCard.completed')}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity='error'
          variant='filled'
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </PullToRefresh>
  )
}

export default TaskListCard
