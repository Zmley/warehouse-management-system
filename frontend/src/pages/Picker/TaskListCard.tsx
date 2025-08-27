import React, { useEffect, useMemo, useState } from 'react'
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
  Chip
} from '@mui/material'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { usePickerTasks } from 'hooks/usePickerTask'
import { TaskCategoryEnum } from 'constants/index'
import { useTranslation } from 'react-i18next'

interface Props {
  status: TaskCategoryEnum
}

type SourceBinView = {
  bin?: { binCode?: string }
  quantity?: number
}

const TaskListCard: React.FC<Props> = ({ status }) => {
  const { t } = useTranslation()
  const { tasks, fetchTasks } = usePickerTasks()

  const [hasFetched, setHasFetched] = useState(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleManualRefresh = async () => {
    try {
      await fetchTasks()
    } catch (err: any) {
      setError(err.message || 'Error refreshing tasks')
      setOpen(true)
    }
  }

  const filteredTasks = useMemo(
    () => tasks.filter(task => task.status === status),
    [tasks, status]
  )

  return (
    <PullToRefresh
      onRefresh={handleManualRefresh}
      pullingContent={<></>}
      refreshingContent={<></>}
    >
      <Box p={2} pt={0} pb={10}>
        {/* 顶部下拉提示（与 TaskList 保持一致） */}
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
        </Box>

        {/* Loading / Empty */}
        {!hasFetched ? (
          <Box display='flex' justifyContent='center' mt={6}>
            <CircularProgress size={30} thickness={5} />
          </Box>
        ) : filteredTasks.length === 0 ? (
          <>
            <Typography
              color='text.secondary'
              textAlign='center'
              sx={{ mt: 6, fontSize: 14 }}
            >
              {t('taskList.emptyTitle') || t('taskListCard.empty', { status })}
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
                new Set(bins.map(b => b?.bin?.binCode ?? '--'))
              )
              const display = uniqueCodes.slice(0, 3)
              const rest = uniqueCodes.length - display.length

              const firstBin = uniqueCodes[0] ?? ''
              const isAisleTask = firstBin.startsWith('AISLE-')

              const cardBorderColor = isAisleTask ? '#059669' : '#2563eb'
              const cardBg = isAisleTask
                ? 'linear-gradient(180deg,#ecfdf5 0%, #f6fffb 100%)'
                : 'linear-gradient(180deg,#eff6ff 0%, #f7faff 100%)'

              const outOfStock = uniqueCodes.length === 0

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
                    {/* SourceBins（Chip + 折叠/+N） */}
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
                          <Box
                            sx={{
                              mt: 0.5,
                              display: 'flex',
                              justifyContent: 'center',
                              gap: 0.5,
                              flexWrap: 'nowrap',
                              overflowX: 'auto',
                              px: 0.5,
                              '&::-webkit-scrollbar': { display: 'none' }
                            }}
                          >
                            {display.map(code => (
                              <Chip
                                key={code}
                                label={code}
                                size='small'
                                sx={{
                                  height: 22,
                                  borderRadius: '999px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  bgcolor: isAisleTask ? '#dcfce7' : '#dbeafe',
                                  border: `1px solid ${isAisleTask ? '#86efac' : '#93c5fd'}`
                                }}
                              />
                            ))}
                            {rest > 0 && (
                              <Chip
                                label={`+${rest}`}
                                size='small'
                                sx={{
                                  height: 22,
                                  borderRadius: '999px',
                                  fontSize: 11,
                                  bgcolor: '#f3f4f6',
                                  border: '1px solid #e5e7eb'
                                }}
                              />
                            )}
                          </Box>
                        )}
                      </Grid>

                      {/* 三列主信息 */}
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

                    {/* 底部信息 */}
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
                        {`${t('taskList.createDate')}: ${new Date(task.createdAt).toLocaleString()}`}
                      </Typography>

                      {status === 'COMPLETED' && (
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
                  </CardContent>
                </Card>
              )
            })}
          </Box>
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
