import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import { useTask } from 'hooks/useTask'
import { useIntersectLoadMore } from 'hooks/useIntersectLoadMore'
import TaskListSearchToolbar from 'components/TaskListSearchToolbar'
import { Task } from 'types/task'
import { productCodesFromTasks } from 'utils/taskSearchSuggestions'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { useTaskContext } from 'contexts/task'
import { useTranslation } from 'react-i18next'
import { ERROR_CODE } from 'utils/errorCodes'
import { TASK_LIST_PAGE_SIZE } from 'constants/index'

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

const isRushTaskNote = (note: string | null | undefined) =>
  note === 'RUSH_TASK' || note === 'URGENT' || note === '加急'

const TaskList: React.FC<TaskListProps> = ({ setView }) => {
  const { t } = useTranslation()
  const {
    tasks,
    fetchTasks,
    loadMoreTasks,
    commitSearchKeyword,
    clearSearchKeyword,
    acceptTask,
    isLoading,
    isLoadingMore,
    hasMore,
    error
  } = useTask()
  const { fetchMyTask } = useTaskContext()

  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [category, setCategory] = useState<'assembly' | 'other'>('assembly')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchToolbarExpanded, setSearchToolbarExpanded] = useState(false)
  const [showLoadMoreSpinner, setShowLoadMoreSpinner] = useState(false)

  const sourceDragRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  useEffect(() => {
    if (error) setOpen(true)
  }, [error])

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSearchToolbarExpanded(false)
  }, [category])

  useEffect(() => {
    if (!isLoadingMore) {
      setShowLoadMoreSpinner(false)
      return
    }
    const id = window.setTimeout(() => setShowLoadMoreSpinner(true), 450)
    return () => window.clearTimeout(id)
  }, [isLoadingMore])

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

  const isAssemblyTask = (task: Task) => {
    const pickupCode =
      task.destinationBinCode || task.destinationBin?.binCode || ''
    return pickupCode.includes('_')
  }

  const visibleTasks = useMemo(() => {
    if (category === 'assembly') {
      return filteredTasks.filter(task => isAssemblyTask(task))
    }
    return filteredTasks.filter(task => !isAssemblyTask(task))
  }, [filteredTasks, category])

  const taskCounts = useMemo(() => {
    const assembly = filteredTasks.filter(task => isAssemblyTask(task)).length
    return {
      assembly,
      other: filteredTasks.length - assembly
    }
  }, [filteredTasks])

  /** 联想仅当前视图可见任务（总成/其他 + 缺货筛选）；搜索接口仍查全库 */
  const suggestionProductCodes = useMemo(
    () => productCodesFromTasks(visibleTasks),
    [visibleTasks]
  )

  const loadMoreEnabled =
    hasMore &&
    !isLoading &&
    !isLoadingMore &&
    tasks.length > 0 &&
    tasks.length >= TASK_LIST_PAGE_SIZE

  const sentinelRef = useIntersectLoadMore(
    () => {
      void loadMoreTasks()
    },
    loadMoreEnabled,
    '0px',
    1200
  )

  return (
    <Box sx={{ backgroundColor: '#F7F9FC' }}>
      <PullToRefresh
        onRefresh={handleManualRefresh}
        pullingContent={
          <Box
            sx={{
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant='caption' sx={{ fontSize: 12, fontStyle: 'italic' }}>
              {t('taskList.pullToRefresh')}
            </Typography>
          </Box>
        }
        refreshingContent={
          <Box
            sx={{
              py: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'text.secondary'
            }}
          >
            <CircularProgress size={16} thickness={5} />
            <Typography variant='caption' sx={{ fontSize: 12 }}>
              {t('taskList.refreshing', 'Refreshing…')}
            </Typography>
          </Box>
        }
      >
        <Box
          p={1}
          pt={0.5}
          sx={{
            position: 'relative',
            backgroundColor: '#F7F9FC',
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
          }}
        >
          <TaskListSearchToolbar
            expanded={searchToolbarExpanded}
            onExpandedChange={setSearchToolbarExpanded}
            value={searchDraft}
            onChange={setSearchDraft}
            onSubmit={q => {
              setSearchDraft(q)
              void commitSearchKeyword(q)
            }}
            onClear={() => {
              setSearchDraft('')
              void clearSearchKeyword()
            }}
            options={suggestionProductCodes}
            disabled={isLoading && tasks.length === 0}
            showOutOfStock={showOutOfStock}
            onToggleOutOfStock={() => setShowOutOfStock(v => !v)}
            centerSlot={
              <Box
                sx={{
                  display: 'flex',
                  gap: 0,
                  p: 0.2,
                  borderRadius: 999,
                  background: '#eef2f7',
                  flexShrink: 1,
                  minWidth: 0,
                  maxWidth: '100%'
                }}
              >
                <Button
                  variant={category === 'assembly' ? 'contained' : 'text'}
                  onClick={() => setCategory('assembly')}
                  sx={{
                    minWidth: 0,
                    flex: '1 1 50%',
                    height: 28,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontSize: 11,
                    fontWeight: 800,
                    px: 0.75,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {`${t('taskList.category.assembly')} (${taskCounts.assembly})`}
                </Button>
                <Button
                  variant={category === 'other' ? 'contained' : 'text'}
                  onClick={() => setCategory('other')}
                  sx={{
                    minWidth: 0,
                    flex: '1 1 50%',
                    height: 28,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontSize: 11,
                    fontWeight: 800,
                    px: 0.75,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {`${t('taskList.category.other')} (${taskCounts.other})`}
                </Button>
              </Box>
            }
          />

          {isLoading ? (
            <Box display='flex' justifyContent='center' mt={4}>
              <CircularProgress size={30} thickness={5} />
            </Box>
          ) : (
            <>
              {visibleTasks.length === 0 ? (
                <Typography color='text.secondary' textAlign='center'>
                  {t('taskList.empty')}
                </Typography>
              ) : (
                <Box>
                  {visibleTasks.map((task: Task) => {
                const isOutOfStock =
                  !task.sourceBins || task.sourceBins.length === 0
                const parts = buildSourceBinsParts(
                  task.sourceBins as unknown as SourceBinView[]
                )

                const firstBinCode = parts[0]?.code ?? ''
                const isAisleTask = firstBinCode.startsWith('AISLE-')
                const isRush = isRushTaskNote(task.note)

                const cardBorderColor = isRush
                  ? '#d32f2f'
                  : isAisleTask
                    ? '#059669'
                    : '#2563eb'
                const cardBgColor = isRush
                  ? '#fff7f7'
                  : isAisleTask
                    ? '#ecfdf5'
                    : '#eff6ff'

                return (
                  <Card
                    key={task.taskID}
                    variant='outlined'
                    sx={{
                      position: 'relative',
                      mb: 2,
                      minHeight: 155,
                      borderRadius: 3,
                      backgroundColor: cardBgColor,
                      border: `1.5px solid ${cardBorderColor}`,
                      boxShadow: '0 2px 6px #0000000D'
                    }}
                  >
                    {isRush && (
                      <Chip
                        label={t('taskList.urgent')}
                        variant='outlined'
                        color='error'
                        size='small'
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 12,
                          zIndex: 1,
                          fontWeight: 700,
                          height: 22,
                          '& .MuiChip-label': { px: 0.9 }
                        }}
                      />
                    )}
                    <CardContent
                      sx={{
                        py: 1,
                        px: 1.5,
                        pt: 1,
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
                              ref={sourceDragRef}
                              onMouseDown={e => {
                                isDraggingRef.current = true
                                startXRef.current = e.pageX
                                scrollLeftRef.current =
                                  e.currentTarget.scrollLeft
                              }}
                              onMouseMove={e => {
                                if (!isDraggingRef.current) return
                                const x = e.pageX - startXRef.current
                                e.currentTarget.scrollLeft =
                                  scrollLeftRef.current - x
                              }}
                              onMouseUp={() => {
                                isDraggingRef.current = false
                              }}
                              onMouseLeave={() => {
                                isDraggingRef.current = false
                              }}
                              onTouchStart={e => {
                                isDraggingRef.current = true
                                startXRef.current = e.touches[0].pageX
                                scrollLeftRef.current =
                                  e.currentTarget.scrollLeft
                              }}
                              onTouchMove={e => {
                                if (!isDraggingRef.current) return
                                const x = e.touches[0].pageX - startXRef.current
                                e.currentTarget.scrollLeft =
                                  scrollLeftRef.current - x
                              }}
                              onTouchEnd={() => {
                                isDraggingRef.current = false
                              }}
                              sx={{
                                whiteSpace: 'nowrap',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                fontSize: 13,
                                fontWeight: 'bold',
                                WebkitOverflowScrolling: 'touch',
                                userSelect: 'none',

                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                '&::-webkit-scrollbar': {
                                  display: 'none'
                                }
                              }}
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

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0
                          }}
                        >
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
                      </Box>
                    </CardContent>
                  </Card>
                )
                  })}
                </Box>
              )}
              {!isLoading && tasks.length > 0 && hasMore && (
                <Box
                  ref={sentinelRef}
                  sx={{ height: 24, flexShrink: 0 }}
                  aria-hidden
                />
              )}
              {showLoadMoreSpinner && (
                <Box display='flex' justifyContent='center' py={2}>
                  <CircularProgress size={22} thickness={5} />
                </Box>
              )}
            </>
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
