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
import { useTask } from 'hooks/useTask'
import { Task } from 'types/task'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { useTaskContext } from 'contexts/task'
import { useTranslation } from 'react-i18next'

interface TaskListProps {
  setView: (view: 'task' | 'cart') => void
}

const TaskList: React.FC<TaskListProps> = ({ setView }) => {
  const { t } = useTranslation()
  const { tasks, fetchTasks, acceptTask, isLoading, error } = useTask()
  const { fetchMyTask } = useTaskContext()

  const [loadingTasks, setLoadingTasks] = useState<{
    [taskID: string]: boolean
  }>({})
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (error) setOpen(true)
  }, [error])

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTasks()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleAccept = async (taskID: string) => {
    setLoadingTasks(prev => ({ ...prev, [taskID]: true }))
    try {
      const success = await acceptTask(taskID)
      if (success) {
        setView('cart')
      } else {
        setOpen(true)
      }
    } finally {
      setLoadingTasks(prev => ({ ...prev, [taskID]: false }))
    }
  }

  const handleManualRefresh = async () => {
    await fetchTasks()
    await fetchMyTask()
  }

  return (
    <PullToRefresh onRefresh={handleManualRefresh}>
      <Box p={2} pt={0} pb={10}>
        <Box
          textAlign='center'
          mb={1}
          color='text.secondary'
          fontSize={13}
          fontStyle='italic'
        >
          {t('taskList.pullToRefresh')}
        </Box>

        {isLoading ? (
          <Box display='flex' justifyContent='center' mt={4}>
            <CircularProgress size={30} thickness={5} />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography color='text.secondary' textAlign='center'>
            {t('taskList.empty')}
          </Typography>
        ) : (
          tasks.map((task: Task) => {
            const isOutOfStock =
              !task.sourceBins || task.sourceBins.length === 0

            const firstSourceBin = task.sourceBins?.[0]
            const binCode =
              typeof firstSourceBin === 'object' && 'bin' in firstSourceBin
                ? firstSourceBin?.bin?.binCode
                : typeof firstSourceBin === 'object' &&
                  'binCode' in firstSourceBin
                ? (firstSourceBin as any).binCode
                : ''

            const isAisleTask =
              typeof binCode === 'string' && binCode.startsWith('AISLE-')

            const cardBorderColor = isAisleTask ? '#059669' : '#2563eb'
            const cardBgColor = isAisleTask ? '#ecfdf5' : '#eff6ff'

            return (
              <Card
                key={task.taskID}
                variant='outlined'
                sx={{
                  mb: 2,
                  height: 155,
                  borderRadius: 3,
                  backgroundColor: cardBgColor,
                  border: `1.5px solid ${cardBorderColor}`,
                  boxShadow: '0 2px 6px #0000000D'
                }}
              >
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} textAlign='center'>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontSize={11}
                      >
                        {t('taskList.sourceBin')}
                      </Typography>
                      <Box
                        sx={{
                          fontWeight: 'bold',
                          fontSize: 13,
                          wordBreak: 'break-word',
                          mt: 0.3
                        }}
                      >
                        {task.sourceBins && task.sourceBins.length > 0 ? (
                          task.sourceBins
                            .map((inv: any) => inv.bin?.binCode)
                            .join(' / ')
                        ) : (
                          <Box
                            display='flex'
                            justifyContent='center'
                            alignItems='flex-start'
                            gap={0.5}
                          >
                            <Typography
                              fontSize={12}
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
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontSize={11}
                      >
                        {t('taskList.product')}
                      </Typography>
                      <Typography fontWeight='bold' fontSize={13}>
                        {task.productCode}
                      </Typography>
                    </Grid>

                    <Grid item xs={4} textAlign='center'>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontSize={11}
                      >
                        {t('taskList.quantity')}
                      </Typography>
                      <Typography fontWeight='bold' fontSize={13}>
                        {task.quantity || 'ALL'}
                      </Typography>
                    </Grid>

                    <Grid item xs={4} textAlign='center'>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        fontSize={11}
                      >
                        {t('taskList.targetBin')}
                      </Typography>
                      <Typography fontWeight='bold' fontSize={13}>
                        {task.destinationBinCode || '--'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1 }} />

                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      fontSize={11}
                    >
                      {t('taskList.createDate')}:{' '}
                      {new Date(task.createdAt).toLocaleString()}
                    </Typography>

                    <Button
                      variant='contained'
                      onClick={() => handleAccept(task.taskID)}
                      disabled={isOutOfStock || loadingTasks[task.taskID]}
                      color={isAisleTask ? 'success' : 'primary'}
                      sx={{
                        fontSize: 11,
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        minHeight: 30,
                        opacity: isOutOfStock ? 0.5 : 1,
                        '&:hover': {
                          backgroundColor: isAisleTask ? '#059669' : '#1e50c2'
                        }
                      }}
                    >
                      {loadingTasks[task.taskID]
                        ? t('taskList.loading')
                        : isAisleTask
                        ? t('taskList.takeOver')
                        : t('taskList.accept')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })
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
          {error || t('taskList.error.unknown')}
        </Alert>
      </Snackbar>
    </PullToRefresh>
  )
}

export default TaskList
