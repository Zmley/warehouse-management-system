import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Autocomplete,
  Button,
  Paper,
  Typography,
  Divider,
  Tooltip
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useTranslation } from 'react-i18next'
import { setSourceBinCode } from 'utils/Storages'

interface ProductInput {
  productCode: string
  quantity: string
}
interface MultiProductInputBoxProps {
  productOptions: string[]
  onSubmit: (items: { productCode: string; quantity: number }[]) => void
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
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    if (defaultItems.length > 0) setInputs(defaultItems)
  }, [defaultItems])

  const handleChange = (
    index: number,
    field: keyof ProductInput,
    value: string
  ) => {
    setInputs(prev => {
      const next = [...prev]
      next[index][field] = value
      return next
    })
  }
  const handleAdd = () =>
    setInputs(prev => [...prev, { productCode: '', quantity: '' }])
  const handleRemove = (index: number) =>
    setInputs(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = () => {
    const parsed = inputs
      .map(it => ({
        productCode: it.productCode.trim(),
        quantity: parseInt(it.quantity)
      }))
      .filter(x => x.productCode && !isNaN(x.quantity) && x.quantity > 0)
    if (parsed.length > 0) {
      setSourceBinCode('staging-area')
      onSubmit(parsed)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        // ✅ 响应式左右内边距，避免小屏被 padding 撑爆
        px: { xs: 1.5, sm: 2 },
        pt: 0,
        pb: 2,
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        // ✅ 居中 & 限制最大宽度
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
          <IconButton
            color='primary'
            size='small'
            onClick={handleAdd}
            sx={{ mr: -0.25 }}
          >
            <AddCircleOutlineIcon fontSize='medium' />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        variant='outlined'
        sx={{
          borderRadius: 2,
          borderColor: '#E5E7EB',
          overflow: 'hidden',
          maxWidth: '100%'
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

        {inputs.map((input, index) => (
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
              <Autocomplete
                options={(function () {
                  const q = (input.productCode || '').trim().toLowerCase()
                  if (q.length < 1) return []
                  return productOptions
                    .filter(o => o.toLowerCase().startsWith(q))
                    .slice(0, 50)
                })()}
                filterOptions={x => x}
                inputValue={input.productCode}
                onInputChange={(_, v) => handleChange(index, 'productCode', v)}
                value={
                  productOptions.includes(input.productCode)
                    ? input.productCode
                    : undefined
                }
                onChange={(_, newValue) => {
                  handleChange(index, 'productCode', newValue || '')
                }}
                open={(function () {
                  const q = (input.productCode || '').trim().toLowerCase()
                  if (q.length < 1) return false
                  const suggestions = productOptions.filter(o =>
                    o.toLowerCase().startsWith(q)
                  )
                  if (suggestions.length === 0) return false
                  const hasExact = productOptions.some(
                    o => o.toLowerCase() === q
                  )
                  return !hasExact
                })()}
                freeSolo={false}
                openOnFocus={false}
                forcePopupIcon={false}
                disableClearable
                autoHighlight
                noOptionsText=''
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder={t('scan.productCode')}
                    size='small'
                    fullWidth
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
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: null
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
                onChange={e => handleChange(index, 'quantity', e.target.value)}
                size='small'
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
        ))}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <Button
          onClick={handleSubmit}
          variant='contained'
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 700,
            fontSize: 'clamp(14px,3.2vw,16px)',
            background:
              'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 100%)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
          }}
        >
          {t('scan.confirm')}
        </Button>

        {onCancel && (
          <Button
            onClick={onCancel}
            variant='outlined'
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
