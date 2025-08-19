import React, { useEffect, useMemo, useState } from 'react'
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
  Alert,
  IconButton
} from '@mui/material'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { useTask } from 'hooks/useTask'
import { Task } from 'types/task'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { useTaskContext } from 'contexts/task'
import { useTranslation } from 'react-i18next'
import { ERROR_CODE } from 'utils/errorCodes'

interface TaskListProps {
  setView: (view: 'tasks' | 'cart') => void
}

type SourceBinView = {
  bin?: { binCode?: string }
  quantity?: number
}

const TaskList: React.FC<TaskListProps> = ({ setView }) => {
  const { t } = useTranslation()
  const { tasks, fetchTasks, acceptTask, isLoading, error } = useTask()
  const { fetchMyTask } = useTaskContext()

  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  useEffect(() => {
    if (error) setOpen(true)
  }, [error])

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [fetchTasks])

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

  const filteredTasks = useMemo(
    () =>
      tasks.filter(task =>
        showOutOfStock
          ? !task.sourceBins || task.sourceBins.length === 0
          : task.sourceBins && task.sourceBins.length > 0
      ),
    [tasks, showOutOfStock]
  )

  const formatSourceBinsUnique = (sourceBins?: SourceBinView[]) => {
    if (!sourceBins || sourceBins.length === 0) return ''
    const seen = new Set<string>()
    const uniqueCodes: string[] = []
    for (const it of sourceBins) {
      const code = it.bin?.binCode ?? '--'
      if (!seen.has(code)) {
        seen.add(code)
        uniqueCodes.push(code)
      }
    }
    return uniqueCodes.join(' / ')
  }

  return (
    <PullToRefresh
      onRefresh={handleManualRefresh}
      pullingContent={<></>}
      refreshingContent={<></>}
    >
      <Box p={2} pt={0} pb={10} sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            position: 'relative'
          }}
        >
          <Typography
            sx={{
              flex: 1,
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: 13,
              fontStyle: 'italic'
            }}
          >
            {t('taskList.pullToRefresh')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              position: 'absolute',
              right: 10
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 'bold',
                color: showOutOfStock ? '#d32f2f' : '#2563eb'
              }}
            >
              {showOutOfStock
                ? t('taskList.status.outOfStock')
                : t('taskList.status.pending')}
            </Typography>

            <IconButton
              size='small'
              onClick={() => setShowOutOfStock(!showOutOfStock)}
              sx={{
                backgroundColor: '#f0f0f0',
                borderRadius: '50%',
                width: 16,
                height: 16
              }}
            >
              {showOutOfStock ? (
                <ArrowBackIosNewIcon fontSize='small' />
              ) : (
                <ArrowForwardIosIcon fontSize='small' />
              )}
            </IconButton>
          </Box>
        </Box>

        {isLoading ? (
          <Box display='flex' justifyContent='center' mt={4}>
            <CircularProgress size={30} thickness={5} />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <Typography color='text.secondary' textAlign='center'>
            {t('taskList.empty')}
          </Typography>
        ) : (
          <Box>
            {filteredTasks.map((task: Task) => {
              const isOutOfStock =
                !task.sourceBins || task.sourceBins.length === 0

              const sourceBinsLabel = formatSourceBinsUnique(
                task.sourceBins as unknown as SourceBinView[]
              )
              const firstBinCode = sourceBinsLabel.split(' / ')[0] ?? ''
              const isAisleTask = firstBinCode.startsWith('AISLE-')

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

                        {isOutOfStock ? (
                          <Typography
                            fontSize={12}
                            fontWeight='medium'
                            sx={{ color: '#d32f2f' }}
                          >
                            {t('taskList.outOfStock')}
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              overflowX:
                                (task.sourceBins?.length ?? 0) > 5
                                  ? 'auto'
                                  : 'visible',
                              whiteSpace: 'nowrap',
                              fontSize: 13,
                              fontWeight: 'bold'
                            }}
                          >
                            {sourceBinsLabel}
                          </Box>
                        )}
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
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {`${t('taskList.createDate')}: ${new Date(task.createdAt).toLocaleString()}\n${t(
                          'taskList.creator'
                        )}: ${task.creator?.firstName || '--'} ${task.creator?.lastName || ''}`}
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
                          opacity: isOutOfStock ? 0.5 : 1
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
            })}
          </Box>
        )}

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
            {error
              ? t(ERROR_CODE[error] || 'taskList.error.unknown')
              : t('taskList.error.unknown')}
          </Alert>
        </Snackbar>
      </Box>
    </PullToRefresh>
  )
}

export default TaskList
