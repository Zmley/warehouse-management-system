// pages/CreateTask.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  useMediaQuery,
  Paper
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePickerTasks } from 'hooks/usePickerTask'
import { useBin } from 'hooks/useBin'
import { Bin } from 'types/bin'
import { useTranslation } from 'react-i18next'
import { CREATE_TASK_ERROR_CODE } from 'utils/errorCodes'

const BORDER = '#e5e7eb'
const PRIMARY = '#2563eb'
const DANGER_BG = '#fff7f7'
const SECTION_BG = '#f9fafb'

const CreateTask: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'))
  const navigate = useNavigate()
  const location = useLocation()
  const bin: Bin = location.state?.bin

  const productOptions = (bin?.defaultProductCodes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const [productCode, setProductCode] = useState<string>(
    productOptions[0] || ''
  )
  const [sourceBins, setSourceBins] = useState<
    { binCode: string; quantity: number }[]
  >([])
  const [sourceError, setSourceError] = useState(false)

  const { createTask, isLoading, error } = usePickerTasks()
  const { fetchBinCodesByProductCode } = useBin()

  const getCreateTaskErrorKey = (code: string | null) =>
    code
      ? CREATE_TASK_ERROR_CODE[code] || 'createTask.error.unknown'
      : 'createTask.error.unknown'

  useEffect(() => {
    const run = async () => {
      if (!productCode) {
        setSourceBins([])
        setSourceError(false)
        return
      }
      try {
        const res = await fetchBinCodesByProductCode(productCode)
        setSourceBins(res || [])
        setSourceError(!res || res.length === 0)
      } catch {
        setSourceBins([])
        setSourceError(true)
      }
    }
    run()
  }, [productCode, fetchBinCodesByProductCode])

  const handleSubmit = async () => {
    if (!productCode || !bin?.binCode) return
    const ok = await createTask(bin.binCode, productCode)
    if (ok) navigate('/success')
  }

  const productButtonSx = (active: boolean) => ({
    px: 2,
    height: 48,
    borderRadius: '999px',
    border: `1.5px solid ${active ? PRIMARY : BORDER}`,
    bgcolor: active ? '#f4f7ff' : '#fff',
    color: '#111827',
    fontWeight: 800,
    letterSpacing: 0.2,
    textTransform: 'none' as const,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    '&:active': { transform: 'scale(0.995)' }
  })

  const productWrap = useMemo(
    () => (
      <Stack direction='row' gap={1} flexWrap='wrap'>
        {productOptions.length ? (
          productOptions.map(code => {
            const active = code === productCode
            return (
              <Button
                key={code}
                variant='contained'
                onClick={() => setProductCode(code)}
                sx={productButtonSx(active)}
              >
                {code}
              </Button>
            )
          })
        ) : (
          <Typography color='text.secondary'>--</Typography>
        )}
      </Stack>
    ),
    [productOptions, productCode]
  )

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#fafafa',
        display: 'flex',
        justifyContent: 'center',
        p: { xs: 1, sm: 2 }
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 880,
          borderRadius: 3,
          border: `1px solid ${BORDER}`,
          background: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
          {/* 标题 */}
          <Typography
            variant='h6'
            sx={{ fontWeight: 800, color: '#111827', mb: 1 }}
          >
            {t('createTask.title')}
          </Typography>

          {/* 目标货位 */}
          <Paper
            variant='outlined'
            sx={{
              p: { xs: 1, sm: 1.25 },
              borderRadius: 2,
              borderColor: BORDER,
              background: SECTION_BG,
              display: 'grid',
              gridTemplateColumns: isSmUp ? '160px 1fr' : '1fr',
              gap: 1,
              mb: 1.25
            }}
          >
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
              {t('createTask.targetBin')}
            </Typography>
            <Chip
              label={bin?.binCode || '--'}
              sx={{
                height: 28,
                borderRadius: '999px',
                fontWeight: 800,
                bgcolor: '#fff',
                border: `1.5px solid ${BORDER}`,
                color: '#111827'
              }}
            />
          </Paper>

          <Divider sx={{ my: 1, borderColor: BORDER }} />

          {/* 产品编码 */}
          <Box
            sx={{
              p: { xs: 1, sm: 1.25 },
              borderRadius: 2,
              border: `1px solid ${BORDER}`,
              background: SECTION_BG,
              mb: 1.25
            }}
          >
            <Typography
              sx={{ fontSize: 12, color: 'text.secondary', mb: 1, ml: 0.5 }}
            >
              {t('createTask.productCode')}
            </Typography>
            {productWrap}
          </Box>

          {/* 来源货位 */}
          <Box
            sx={{
              p: { xs: 1, sm: 1.25 },
              borderRadius: 2,
              border: `1px solid ${BORDER}`,
              background: sourceError ? DANGER_BG : SECTION_BG
            }}
          >
            <Stack
              direction='row'
              alignItems='center'
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {t('createTask.sourceBins')}
              </Typography>
              {isLoading && <CircularProgress size={16} thickness={5} />}
              {sourceError && !isLoading && (
                <Typography
                  sx={{ fontSize: 12, color: '#b91c1c', fontWeight: 700 }}
                >
                  {t('createTask.noMatchingBins')}
                </Typography>
              )}
            </Stack>

            {!isLoading && !sourceError && (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}
              >
                {sourceBins.length ? (
                  sourceBins.map(({ binCode, quantity }) => (
                    <Chip
                      key={binCode}
                      label={`${binCode} · ${t('createTask.qty')}: ${quantity}`}
                      size='small'
                      sx={{
                        height: 24,
                        borderRadius: '999px',
                        bgcolor: '#fff',
                        border: `1px solid ${BORDER}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#111827'
                      }}
                    />
                  ))
                ) : (
                  <Typography color='text.secondary' fontSize={12}>
                    -
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* 错误提示 */}
          {error && (
            <Typography
              color='error'
              fontWeight={700}
              textAlign='center'
              sx={{ mt: 1 }}
            >
              {t(getCreateTaskErrorKey(error))}
            </Typography>
          )}
        </CardContent>

        {/* 底部按钮 */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            px: { xs: 1.25, sm: 2 },
            py: 1.25,
            borderTop: `1px solid ${BORDER}`,
            bgcolor: '#fff',
            display: 'flex',
            gap: 1,
            flexWrap: isSmUp ? 'nowrap' : 'wrap'
          }}
        >
          <Button
            variant='outlined'
            color='inherit'
            onClick={() => navigate('/')}
            sx={{
              borderRadius: 14,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: 16,
              height: 64,
              px: 3,
              flex: isSmUp ? '0 0 240px' : '1 1 100%',
              borderColor: BORDER
            }}
          >
            {t('createTask.cancel')}
          </Button>

          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={!productCode || isLoading}
            sx={{
              borderRadius: 14,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: 16,
              height: 64,
              px: 3,
              flex: '1 1 auto',
              bgcolor: PRIMARY,
              '&:hover': { bgcolor: '#1e4fd6' },
              boxShadow: '0 6px 12px rgba(0,0,0,0.10)'
            }}
          >
            {isLoading
              ? t('createTask.loading')
              : sourceError
                ? t('createTask.outOfStock')
                : t('createTask.create')}
          </Button>
        </Box>
      </Card>
    </Box>
  )
}

export default CreateTask
