import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Autocomplete,
  Button,
  Paper,
  Typography,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useTranslation } from 'react-i18next'
import { setSourceBinCode } from 'utils/Storages'
import { startsWithFilter } from 'utils/inputHelpers'

interface ProductInput {
  productCode: string
  quantity: string
}

interface MultiProductInputBoxProps {
  productOptions: string[]
  onSubmit: (
    items: { productCode: string; quantity: number }[]
  ) => void | Promise<any>
  onCancel?: () => void
  defaultItems?: ProductInput[]
}

const ROW_H = 40
const QTY_MIN_W = 60
const DEL_W = 32
const GRID_COLS = `minmax(0,1.5fr) minmax(${QTY_MIN_W}px,0.5fr) ${DEL_W}px`

const MultiProductInputBox: React.FC<MultiProductInputBoxProps> = ({
  productOptions,
  onSubmit,
  onCancel,
  defaultItems = []
}) => {
  const { t } = useTranslation()
  const [inputs, setInputs] = useState<ProductInput[]>(
    defaultItems.length > 0 ? defaultItems : [{ productCode: '', quantity: '' }]
  )

  // 提交中状态：用于禁用按钮/输入，避免重复提交
  const [submitting, setSubmitting] = useState(false)
  // 额外的快速连点保护（防极短时间内多次点击触发）
  const clickLockRef = useRef(false)

  useEffect(() => {
    if (defaultItems.length > 0) setInputs(defaultItems)
  }, [defaultItems])

  const setInputField = (
    index: number,
    field: keyof ProductInput,
    value: string
  ) => {
    setInputs(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleAdd = () =>
    setInputs(prev => [...prev, { productCode: '', quantity: '' }])

  const handleRemove = (index: number) =>
    setInputs(prev => prev.filter((_, i) => i !== index))

  // 解析/校验结果，用 useMemo 避免每次渲染重复计算
  const parsed = useMemo(
    () =>
      inputs
        .map(it => ({
          productCode: (it.productCode || '').trim(),
          quantity: parseInt(it.quantity)
        }))
        .filter(x => x.productCode && !isNaN(x.quantity) && x.quantity > 0),
    [inputs]
  )

  const canSubmit = parsed.length > 0 && !submitting

  const handleSubmit = async () => {
    if (submitting || clickLockRef.current) return
    if (!parsed.length) return

    // 锁定：按钮禁用 + 防连点
    setSubmitting(true)
    clickLockRef.current = true

    try {
      // 这里保持你原有的逻辑
      setSourceBinCode('staging-area')
      // 支持 onSubmit 返回 Promise 或普通函数
      await Promise.resolve(onSubmit(parsed))
    } catch (e) {
      // 失败也要解锁，交由上层显示错误
      console.error('Submit failed:', e)
    } finally {
      // 解锁
      setSubmitting(false)
      // 轻微延迟再放开 clickLock，避免设备上极快的双击
      setTimeout(() => {
        clickLockRef.current = false
      }, 250)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 1.5, sm: 2 },
        pt: 0,
        pb: 2,
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 680,
        mx: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: '#1e40af',
            fontSize: 'clamp(14px,2.8vw,16px)'
          }}
        >
          {t('scan.addProducts') || '添加产品'}
        </Typography>
        <Tooltip title={t('common.add') || '新增'}>
          <span>
            <IconButton
              color='primary'
              size='small'
              onClick={handleAdd}
              disabled={submitting}
              sx={{ mr: -0.25 }}
            >
              <AddCircleOutlineIcon fontSize='medium' />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Paper
        variant='outlined'
        sx={{
          borderRadius: 2,
          borderColor: '#E5E7EB',
          overflow: 'hidden',
          maxWidth: '100%',
          opacity: submitting ? 0.85 : 1
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            alignItems: 'center',
            columnGap: { xs: 1, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            py: 0.75,
            bgcolor: '#F8FAFC',
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: 12 }}>
            {t('scan.productCode') || '产品码'}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              color: '#334155',
              fontSize: 12,
              textAlign: 'center'
            }}
          >
            {t('scan.quantity') || '数量'}
          </Typography>
          <Box />
        </Box>

        {inputs.map((input, index) => {
          const selected: string | undefined = productOptions.includes(
            (input.productCode || '').trim()
          )
            ? (input.productCode || '').trim()
            : undefined

          return (
            <React.Fragment key={index}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  alignItems: 'center',
                  columnGap: { xs: 1, sm: 1.5 },
                  px: { xs: 1.5, sm: 2 },
                  py: 0.5,
                  minWidth: 0
                }}
              >
                <Autocomplete<string, false, false, false>
                  options={productOptions}
                  freeSolo={false}
                  disableClearable={false}
                  clearOnBlur
                  forcePopupIcon={false}
                  autoHighlight
                  value={selected}
                  onChange={(_, newValue) => {
                    if (submitting) return
                    setInputField(index, 'productCode', newValue ?? '')
                  }}
                  filterOptions={(opts, state) =>
                    startsWithFilter(opts, state.inputValue)
                  }
                  isOptionEqualToValue={(opt, val) => opt === val}
                  getOptionLabel={o => o}
                  noOptionsText=''
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder={t('scan.productCode')}
                      size='small'
                      fullWidth
                      disabled={submitting}
                      sx={{
                        backgroundColor: '#fff',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': { height: 40 },
                        '& .MuiOutlinedInput-input': {
                          fontSize: 16,
                          px: 1.25,
                          whiteSpace: 'nowrap',
                          overflowX: 'auto',
                          textOverflow: 'clip',
                          WebkitOverflowScrolling: 'touch'
                        }
                      }}
                    />
                  )}
                  fullWidth
                  ListboxProps={{ style: { maxHeight: 300 } }}
                  sx={{ flex: 5, minWidth: 0 }}
                />

                <TextField
                  placeholder={t('scan.quantity')}
                  type='number'
                  inputProps={{
                    min: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    style: {
                      fontSize: 14,
                      textAlign: 'center',
                      height: ROW_H - 2
                    }
                  }}
                  value={input.quantity}
                  onChange={e => {
                    if (submitting) return
                    setInputField(index, 'quantity', e.target.value)
                  }}
                  size='small'
                  disabled={submitting}
                  sx={{
                    minWidth: 0,
                    '& .MuiOutlinedInput-root': {
                      height: ROW_H,
                      borderRadius: 1,
                      bgcolor: '#FAFBFC'
                    },
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button':
                      {
                        WebkitAppearance: 'none',
                        margin: 0
                      }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title={t('common.delete') || '删除'}>
                    <span>
                      <IconButton
                        color='error'
                        onClick={() => handleRemove(index)}
                        size='small'
                        disabled={submitting}
                        sx={{ p: 0.75 }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {index < inputs.length - 1 && <Divider sx={{ m: 0 }} />}
            </React.Fragment>
          )
        })}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={!canSubmit}
          endIcon={
            submitting ? <CircularProgress size={16} thickness={5} /> : null
          }
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 700,
            fontSize: 'clamp(14px,3.2vw,16px)',
            background:
              'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 100%)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            '&.Mui-disabled': {
              color: 'rgba(255,255,255,0.7)'
            }
          }}
        >
          {submitting
            ? t('common.submitting') || '提交中…'
            : t('scan.confirm') || '确认'}
        </Button>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant='outlined'
            disabled={submitting}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 700,
              fontSize: 'clamp(14px,3.2vw,16px)',
              color: '#ef4444',
              borderColor: '#ef4444'
            }}
          >
            {t('scan.cancel')}
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default MultiProductInputBox
