import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  IconButton
} from '@mui/material'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { usePickerTasks } from 'hooks/usePickerTask'
import { useIntersectLoadMore } from 'hooks/useIntersectLoadMore'
import { productCodesFromTasks } from 'utils/taskSearchSuggestions'
import MobileTaskSearchBar from 'components/MobileTaskSearchBar'
import { TaskCategoryEnum, TASK_LIST_PAGE_SIZE } from 'constants/index'
import { useTranslation } from 'react-i18next'

interface Props {
  status: TaskCategoryEnum
}

type SourceBinView = {
  bin?: { binCode?: string }
}

const PullingIndicator = ({ text }: { text: string }) => (
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
      {text}
    </Typography>
  </Box>
)

const TaskListCard: React.FC<Props> = ({ status }) => {
  const { t } = useTranslation()
  const {
    tasks,
    fetchTasks,
    loadMoreTasks,
    commitSearchKeyword,
    clearSearchKeyword,
    hasMore,
    isLoading,
    isLoadingMore,
    setRush
  } = usePickerTasks()

  const [hasFetched, setHasFetched] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingUrgent, setUpdatingUrgent] = useState<Record<string, boolean>>({})
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const [showLoadMoreSpinner, setShowLoadMoreSpinner] = useState(false)

  useEffect(() => {
    setHasFetched(false)
    setSearchDraft('')
    const fetchData = async () => {
      try {
        await fetchTasks(status, { resetKeyword: true })
        setHasFetched(true)
      } catch (err: any) {
        setError(err.message || 'Error fetching tasks')
        setOpen(true)
      }
    }
    void fetchData()
  }, [status, fetchTasks])

  useEffect(() => {
    if (!isLoadingMore) {
      setShowLoadMoreSpinner(false)
      return
    }
    const id = window.setTimeout(() => setShowLoadMoreSpinner(true), 450)
    return () => window.clearTimeout(id)
  }, [isLoadingMore])

  const handleManualRefresh = async () => {
    try {
      await fetchTasks(status, { resetKeyword: false })
    } catch (err: any) {
      setError(err.message || 'Error refreshing tasks')
      setOpen(true)
    }
  }

  const filteredTasks = useMemo(() => {
    const byStatus = tasks.filter(task => task.status === status)
    return byStatus.filter(task =>
      showOutOfStock
        ? !task.sourceBins || task.sourceBins.length === 0
        : task.sourceBins && task.sourceBins.length > 0
    )
  }, [tasks, status, showOutOfStock])

  /** 联想仅当前列表筛选后可见任务（待处理/缺货）；搜索接口仍查全库 */
  const suggestionProductCodes = useMemo(
    () => productCodesFromTasks(filteredTasks),
    [filteredTasks]
  )

  const onLoadMore = useCallback(() => {
    void loadMoreTasks()
  }, [loadMoreTasks])

  const loadMoreEnabled =
    hasMore &&
    !isLoading &&
    !isLoadingMore &&
    tasks.length > 0 &&
    tasks.length >= TASK_LIST_PAGE_SIZE

  const sentinelRef = useIntersectLoadMore(
    onLoadMore,
    loadMoreEnabled,
    '0px',
    1200
  )

  return (
    <Box sx={{ touchAction: 'pan-y' }}>
      <PullToRefresh
        onRefresh={handleManualRefresh}
        pullDownThreshold={70}
        maxPullDownDistance={120}
        resistance={2.5}
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
          <PullingIndicator text={t('taskList.refreshing', 'Refreshing…')} />
        }
      >
        <Box p={2} pt={0} pb={10}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 1.25,
              minWidth: 0
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <MobileTaskSearchBar
                compact
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
                placeholder={t('taskList.searchPlaceholder')}
                noResultsText={t('taskList.searchNoMatch')}
                disabled={isLoading && tasks.length === 0}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flexShrink: 0
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: showOutOfStock ? '#d32f2f' : '#2563eb',
                  whiteSpace: 'nowrap'
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

          {!hasFetched || (isLoading && tasks.length === 0) ? (
            <Box display='flex' justifyContent='center' mt={6}>
              <CircularProgress size={30} thickness={5} />
            </Box>
          ) : (
            <>
              {filteredTasks.length === 0 ? (
                <>
                  <Typography
                    color='text.secondary'
                    textAlign='center'
                    sx={{ mt: 6, fontSize: 14 }}
                  >
                    {t('taskList.emptyTitle') ||
                      t('taskListCard.empty', { status })}
                  </Typography>
                  <Typography
                    color='text.disabled'
                    textAlign='center'
                    sx={{ mt: 0.5, fontSize: 12 }}
                  >
                    {t('taskList.emptyHint') || ''}
                  </Typography>
                </>
              ) : (
                <Box>
                  {filteredTasks.map(task => {
                const bins = (task.sourceBins as unknown as SourceBinView[]) || []
                const uniqueCodes = Array.from(
                  new Set(bins.map(b => b?.bin?.binCode).filter(Boolean))
                ) as string[]
                const outOfStock = uniqueCodes.length === 0
                const cardBorderColor = '#2563eb'
                const cardBg = 'linear-gradient(180deg,#eff6ff 0%, #f7faff 100%)'
                const isUrgent =
                  task.note === 'RUSH_TASK' ||
                  task.note === 'URGENT' ||
                  task.note === '加急'

                return (
                  <Card
                    key={task.taskID}
                    variant='outlined'
                    sx={{
                      mb: 1.5,
                      borderRadius: 3,
                      background: cardBg,
                      border: `1.5px solid ${cardBorderColor}`,
                      boxShadow: '0 6px 12px rgba(16,24,40,0.06)',
                      transition: 'transform .08s ease',
                      '&:active': { transform: 'scale(0.998)' }
                    }}
                  >
                    <CardContent sx={{ py: 1, px: 1.25 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} textAlign='center'>
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'text.secondary',
                              opacity: 0.8,
                              fontSize: 11
                            }}
                          >
                            {t('taskList.sourceBin')}
                          </Typography>
                          {outOfStock ? (
                            <Typography
                              sx={{
                                mt: 0.5,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#d32f2f'
                              }}
                            >
                              {t('taskList.outOfStock')}
                            </Typography>
                          ) : (
                            <Typography
                              sx={{
                                mt: 0.5,
                                fontSize: 12,
                                fontWeight: 500,
                                color: 'text.secondary'
                              }}
                            >
                              {t('taskList.sourceBinHidden')}
                            </Typography>
                          )}
                        </Grid>

                        <Grid item xs={4} textAlign='center'>
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'text.secondary',
                              opacity: 0.8,
                              fontSize: 11
                            }}
                          >
                            {t('taskList.product')}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: 14,
                              letterSpacing: 0.2
                            }}
                          >
                            {task.productCode}
                          </Typography>
                        </Grid>

                        <Grid item xs={4} textAlign='center'>
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'text.secondary',
                              opacity: 0.8,
                              fontSize: 11
                            }}
                          >
                            {t('taskList.quantity')}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: 14,
                              letterSpacing: 0.2
                            }}
                          >
                            {task.quantity || 'ALL'}
                          </Typography>
                        </Grid>

                        <Grid item xs={4} textAlign='center'>
                          <Typography
                            variant='caption'
                            sx={{
                              color: 'text.secondary',
                              opacity: 0.8,
                              fontSize: 11
                            }}
                          >
                            {t('taskList.targetBin')}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: 14,
                              letterSpacing: 0.2
                            }}
                          >
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
                          {`${t('taskList.createDate')}: ${new Date(
                            task.createdAt
                          ).toLocaleString()}`}
                        </Typography>

                        <Box display='flex' alignItems='center' gap={0.5}>
                          {isUrgent && status !== TaskCategoryEnum.PENDING && (
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: 11,
                                color: '#d32f2f'
                              }}
                            >
                              {t('taskList.urgent')}
                            </Typography>
                          )}
                          {status === TaskCategoryEnum.PENDING && (
                            <FormControlLabel
                              sx={{
                                mr: 0,
                                '& .MuiFormControlLabel-label': { marginLeft: 0.25 }
                              }}
                              control={
                                <Switch
                                  size='small'
                                  checked={isUrgent}
                                  disabled={updatingUrgent[task.taskID]}
                                  color={isUrgent ? 'error' : 'primary'}
                                  onChange={async (_, checked) => {
                                    setUpdatingUrgent(prev => ({
                                      ...prev,
                                      [task.taskID]: true
                                    }))
                                    try {
                                      await setRush(task.taskID, checked)
                                    } finally {
                                      setUpdatingUrgent(prev => ({
                                        ...prev,
                                        [task.taskID]: false
                                      }))
                                    }
                                  }}
                                />
                              }
                              label={
                                <Typography
                                  component='span'
                                  variant='caption'
                                  fontSize={11}
                                  sx={{
                                    color: isUrgent ? '#d32f2f' : 'text.secondary',
                                    fontWeight: isUrgent ? 600 : 400
                                  }}
                                >
                                  {t('taskList.urgent')}
                                </Typography>
                              }
                            />
                          )}
                          {status === TaskCategoryEnum.COMPLETED && (
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: 11,
                                color: 'success.main'
                              }}
                            >
                              {t('taskListCard.completed')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )
                  })}
                </Box>
              )}
              {hasFetched && !isLoading && tasks.length > 0 && hasMore && (
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
    </Box>
  )
}

export default TaskListCard
