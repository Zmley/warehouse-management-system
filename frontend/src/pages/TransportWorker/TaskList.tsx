import React, { useEffect, useMemo, useState, useCallback } from 'react'
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
  note?: string | null
}

const dtf = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

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
      if (document.visibilityState === 'visible') fetchTasks()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange, {
      passive: true
    } as any)
    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange as any
      )
    }
  }, [fetchTasks])

  const handleAccept = useCallback(
    async (taskID: string) => {
      setLoadingTasks(prev => ({ ...prev, [taskID]: true }))
      try {
        const success = await acceptTask(taskID)
        if (success) setView('cart')
        else setOpen(true)
      } finally {
        setLoadingTasks(prev => ({ ...prev, [taskID]: false }))
      }
    },
    [acceptTask, setView]
  )

  const handleManualRefresh = useCallback(async () => {
    await fetchTasks()
    await fetchMyTask()
  }, [fetchTasks, fetchMyTask])

  const filteredTasks = useMemo(
    () =>
      tasks.filter(task =>
        showOutOfStock
          ? !task.sourceBins || task.sourceBins.length === 0
          : task.sourceBins && task.sourceBins.length > 0
      ),
    [tasks, showOutOfStock]
  )

  const buildSourceBinsParts = (sourceBins?: SourceBinView[]) => {
    if (!sourceBins || sourceBins.length === 0) return []
    const seen = new Map<string, string | undefined>() // binCode -> note
    for (const it of sourceBins) {
      const code = it.bin?.binCode ?? '--'
      const rawNote = (it.note ?? '').trim()
      if (!seen.has(code)) {
        seen.set(code, rawNote.length > 0 ? rawNote : undefined)
      } else if (!seen.get(code) && rawNote.length > 0) {
        seen.set(code, rawNote)
      }
    }
    return Array.from(seen.entries()).map(([code, note]) => ({ code, note }))
  }

  return (
    <Box sx={{ backgroundColor: '#F7F9FC' }}>
      <PullToRefresh
        onRefresh={handleManualRefresh}
        pullingContent={
          <Box
            sx={{ py: 1, textAlign: 'center', color: '#6b7280', fontSize: 12 }}
          >
            {t('taskList.pullToRefresh')}
          </Box>
        }
        refreshingContent={
          <Box sx={{ py: 1, textAlign: 'center' }}>
            <CircularProgress size={18} thickness={5} />
          </Box>
        }
      >
        <Box
          p={2}
          pt={0.5}
          sx={{
            position: 'relative',
            backgroundColor: '#F7F9FC',
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              mb: 0.25
            }}
          >
            <Box />
            <Typography
              sx={{
                justifySelf: 'center',
                color: 'text.secondary',
                fontSize: 12,
                fontStyle: 'italic'
              }}
            >
              {t('taskList.pullToRefresh')}
            </Typography>
            <Box
              sx={{
                justifySelf: 'end',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
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
                onClick={() => setShowOutOfStock(v => !v)}
                sx={{
                  backgroundColor: '#f0f0f0',
                  borderRadius: '50%',
                  width: 24,
                  height: 24
                }}
                aria-label={
                  showOutOfStock
                    ? t('taskList.status.pending')
                    : t('taskList.status.outOfStock')
                }
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
                const parts = buildSourceBinsParts(
                  task.sourceBins as unknown as SourceBinView[]
                )
                const sourceBinsTitle = parts
                  .map(p => (p.note ? `${p.code} (${p.note})` : p.code))
                  .join(' / ')
                const firstBinCode = parts[0]?.code ?? ''
                const isAisleTask = firstBinCode.startsWith('AISLE-')

                const cardBorderColor = isAisleTask ? '#059669' : '#2563eb'
                const cardBgColor = isAisleTask ? '#ecfdf5' : '#eff6ff'

                return (
                  <Card
                    key={task.taskID}
                    variant='outlined'
                    sx={{
                      mb: 2,
                      minHeight: 155,
                      borderRadius: 3,
                      backgroundColor: cardBgColor,
                      border: `1.5px solid ${cardBorderColor}`,
                      boxShadow: '0 2px 6px #0000000D'
                    }}
                  >
                    <CardContent
                      sx={{
                        py: 1,
                        px: 1.5,
                        '&:last-child': { pb: 1 }
                      }}
                    >
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
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: 13,
                                fontWeight: 'bold'
                              }}
                              title={sourceBinsTitle}
                            >
                              {parts.map((p, idx) => (
                                <React.Fragment key={`${p.code}-${idx}`}>
                                  <span>{p.code}</span>
                                  {p.note && (
                                    <Typography
                                      component='span'
                                      fontSize={11}
                                      sx={{
                                        color: '#d32f2f',
                                        fontStyle: 'italic',
                                        ml: 0.3
                                      }}
                                    >
                                      ({p.note})
                                    </Typography>
                                  )}
                                  {idx < parts.length - 1 && (
                                    <span>{' / '}</span>
                                  )}
                                </React.Fragment>
                              ))}
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
                          {`${t('taskList.createDate')}: ${dtf.format(new Date(task.createdAt))}\n${t(
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
    </Box>
  )
}

export default TaskList
