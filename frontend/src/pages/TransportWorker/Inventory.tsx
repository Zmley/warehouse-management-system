import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Autocomplete,
  TextField,
  CircularProgress,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useTranslation } from 'react-i18next'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'

const CARD_BG = '#eff6ff'
const CARD_BORDER = '#2563eb'
const CELL_BORDER = '#e5e7eb'
const HEADER_TEXT = '#1e40af'
const CELL_TEXT = '#0f172a'

const CELL_HEIGHT = 34
const FONT_SIZE = 12
const QTY_COL_WIDTH = 100

const INPUT_SX_CENTER = {
  '& .MuiInputBase-root': {
    height: CELL_HEIGHT,
    fontSize: FONT_SIZE,
    p: 0
  },
  '& .MuiOutlinedInput-input': {
    p: '0 !important',
    height: `${CELL_HEIGHT}px !important`,
    lineHeight: `${CELL_HEIGHT}px !important`,
    textAlign: 'center'
  }
} as const

const INPUT_SX_LEFT = {
  '& .MuiInputBase-root': {
    height: CELL_HEIGHT,
    fontSize: FONT_SIZE,
    p: 0
  },
  '& .MuiOutlinedInput-input': {
    paddingLeft: '10px !important',
    paddingRight: '10px !important',
    height: `${CELL_HEIGHT}px !important`,
    lineHeight: `${CELL_HEIGHT}px !important`,
    textAlign: 'left'
  }
} as const

type InventoryItem = {
  inventoryID?: string
  productCode: string
  quantity: number
  bin?: { binCode?: string }
  updatedAt?: string
}

type DraftQty = Record<string, number | ''>
type DraftProd = Record<string, string>
type NewRow = { productCode: string; quantity: number | '' }
type NewRows = Record<string, NewRow[]>
type EmptyDraft = Record<string, { productCode: string; quantity: number | '' }>

/** 判空：与 admin 一致 */
const isEmptyBin = (items: InventoryItem[]) =>
  items.length === 1 && !items[0].inventoryID

const InventoryMobileBinCards: React.FC = () => {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState('')
  const [isFetching, setIsFetching] = useState(false)

  const {
    fetchInventories,
    inventories,
    editInventoriesBulk,
    removeInventory,
    addInventory
  } = useInventory()
  const { fetchProductCodes, productCodes } = useProduct()

  const [editingBin, setEditingBin] = useState<string | null>(null)
  const [productDraft, setProductDraft] = useState<DraftProd>({})
  const [quantityDraft, setQuantityDraft] = useState<DraftQty>({})
  const [newRows, setNewRows] = useState<NewRows>({})
  const [emptyDraft, setEmptyDraft] = useState<EmptyDraft>({})

  useEffect(() => {
    fetchProductCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadByKeyword = async (kw: string) => {
    const k = kw.trim()
    if (!k) return
    setIsFetching(true)
    await fetchInventories({ keyword: k, limit: 100 })
    setIsFetching(false)
  }

  const grouped = useMemo(() => {
    const map: Record<string, InventoryItem[]> = {}
    inventories.forEach((it: InventoryItem) => {
      const code = it.bin?.binCode || '--'
      if (!map[code]) map[code] = []
      map[code].push(it)
    })
    Object.values(map).forEach(list =>
      list.sort((a, b) =>
        (a.productCode || '').localeCompare(b.productCode || '')
      )
    )
    return map
  }, [inventories])

  const binCodes = useMemo(() => Object.keys(grouped).sort(), [grouped])

  const enterEdit = (binCode: string) => {
    setEditingBin(binCode)
    setProductDraft({})
    setQuantityDraft({})
    setNewRows(prev => ({ ...prev, [binCode]: prev[binCode] ?? [] }))
    const items = grouped[binCode] || []
    if (isEmptyBin(items) && !emptyDraft[binCode]) {
      setEmptyDraft(prev => ({
        ...prev,
        [binCode]: { productCode: '', quantity: '' }
      }))
    }
  }
  const cancelEdit = (binCode: string) => {
    setEditingBin(null)
    setProductDraft({})
    setQuantityDraft({})
    setNewRows(prev => ({ ...prev, [binCode]: [] }))
    setEmptyDraft(prev => {
      const cp = { ...prev }
      delete cp[binCode]
      return cp
    })
  }

  const saveBin = async (binCode: string) => {
    const items = grouped[binCode] || []
    const empty = isEmptyBin(items)
    const emptyD = emptyDraft[binCode]

    const invalidOld = items.some(it => {
      if (!it.inventoryID) return false
      const key = it.inventoryID
      const finalP = (productDraft[key] ?? it.productCode ?? '').trim()
      const finalQ = quantityDraft[key] ?? it.quantity
      return finalP === '' || finalQ === '' || Number(finalQ) <= 0
    })
    const invalidNew =
      !empty &&
      (newRows[binCode] || []).some(r => {
        const p = (r.productCode || '').trim()
        const q = r.quantity
        return p === '' || q === '' || Number(q) <= 0
      })
    const invalidEmpty =
      empty &&
      !!emptyD &&
      ((emptyD.productCode || '').trim() === '' ||
        emptyD.quantity === '' ||
        Number(emptyD.quantity) <= 0)

    if (invalidOld || invalidNew || invalidEmpty) {
      alert(
        t('inventorySearch.invalidFields') ||
          'Product Code cannot be empty, Quantity must be > 0.'
      )
      return
    }

    setIsFetching(true)
    try {
      const updates = items
        .map(it => {
          if (!it.inventoryID) return null
          const key = it.inventoryID
          const finalP = (productDraft[key] ?? it.productCode) as string
          const finalQ = (quantityDraft[key] ?? it.quantity) as number
          if (finalP !== it.productCode || finalQ !== it.quantity) {
            return {
              inventoryID: it.inventoryID,
              productCode: finalP,
              quantity: finalQ
            }
          }
          return null
        })
        .filter(Boolean) as {
        inventoryID: string
        productCode: string
        quantity: number
      }[]

      if (updates.length) await editInventoriesBulk(updates)

      if (empty && emptyD) {
        await addInventory({
          binCode,
          productCode: emptyD.productCode.trim(),
          quantity: Number(emptyD.quantity)
        })
      }
      if (!empty) {
        for (const row of newRows[binCode] || []) {
          await addInventory({
            binCode,
            productCode: row.productCode.trim(),
            quantity: Number(row.quantity)
          })
        }
      }

      if (keyword.trim())
        await fetchInventories({ keyword: keyword.trim(), limit: 100 })
      cancelEdit(binCode)
    } finally {
      setIsFetching(false)
    }
  }

  const deleteItem = async (_binCode: string, it: InventoryItem) => {
    if (!it.inventoryID) return
    if (
      !window.confirm(
        t('inventorySearch.deleteConfirm') || 'Delete this record?'
      )
    )
      return
    setIsFetching(true)
    try {
      await removeInventory(it.inventoryID)
      if (keyword.trim())
        await fetchInventories({ keyword: keyword.trim(), limit: 100 })
    } finally {
      setIsFetching(false)
    }
  }

  /** 组内新增（非空货位） */
  const addRow = (binCode: string) => {
    setNewRows(prev => ({
      ...prev,
      [binCode]: [...(prev[binCode] || []), { productCode: '', quantity: '' }]
    }))
  }
  const setNewRow = (binCode: string, idx: number, patch: Partial<NewRow>) => {
    setNewRows(prev => {
      const list = [...(prev[binCode] || [])]
      list[idx] = { ...list[idx], ...patch }
      return { ...prev, [binCode]: list }
    })
  }
  const removeNewRow = (binCode: string, idx: number) => {
    setNewRows(prev => {
      const list = (prev[binCode] || []).filter((_, i) => i !== idx)
      return { ...prev, [binCode]: list }
    })
  }

  return (
    <Box p={1.25} sx={{ mx: 'auto', maxWidth: 560 }}>
      <Box mb={1}>
        <Autocomplete
          fullWidth
          options={productCodes}
          value={keyword}
          onChange={(_, v) => {
            const kw = v || ''
            setKeyword(kw)
            loadByKeyword(kw)
          }}
          onInputChange={(_, v) => setKeyword(v)}
          filterOptions={(options, { inputValue }) =>
            inputValue.trim()
              ? options.filter(opt =>
                  opt.toLowerCase().includes(inputValue.toLowerCase())
                )
              : []
          }
          renderInput={params => (
            <TextField
              {...params}
              placeholder={t('inventorySearch.searchPlaceholder')}
              size='small'
              onKeyDown={e => {
                if (e.key === 'Enter') loadByKeyword(keyword)
              }}
              InputProps={{
                ...params.InputProps,
                sx: {
                  pl: 2,
                  pr: 1,
                  py: 0.25,
                  backgroundColor: '#fff',
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  '& fieldset': { border: '1px solid #ccc' },
                  '&:hover fieldset': { borderColor: '#888' }
                },
                endAdornment: (
                  <InputAdornment position='end'>
                    <SearchIcon sx={{ color: '#888', fontSize: 18, mr: 1 }} />
                  </InputAdornment>
                )
              }}
            />
          )}
          noOptionsText={
            keyword.trim() === '' ? '' : t('inventorySearch.noOptions')
          }
        />
      </Box>

      {isFetching ? (
        <Box display='flex' justifyContent='center' mt={3}>
          <CircularProgress size={28} thickness={5} />
        </Box>
      ) : binCodes.length === 0 ? (
        <Typography textAlign='center' color='text.secondary' fontSize={13}>
          {t('inventorySearch.noResult')}
        </Typography>
      ) : (
        <Box>
          {binCodes.map(binCode => {
            const items = grouped[binCode] || []
            const editing = editingBin === binCode
            const empty = isEmptyBin(items)

            return (
              <Card
                key={binCode}
                variant='outlined'
                sx={{
                  mb: 0.75,
                  borderRadius: 2,
                  backgroundColor: CARD_BG,
                  border: `1.25px solid ${CARD_BORDER}`,
                  boxShadow: '0 2px 6px #0000000D'
                }}
              >
                <Box
                  sx={{
                    px: 1,
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(37,99,235,0.20)'
                  }}
                >
                  <Typography
                    sx={{ color: HEADER_TEXT, fontWeight: 800, fontSize: 16 }}
                  >
                    {t('inventorySearch.binCode')}：<b>{binCode}</b>
                  </Typography>
                  <Box display='flex' alignItems='center' gap={0.25}>
                    {!editing ? (
                      <Tooltip title={t('inventorySearch.edit') || 'Edit'}>
                        <span>
                          <IconButton
                            color='primary'
                            size='small'
                            onClick={() => enterEdit(binCode)}
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title={t('inventorySearch.save') || 'Save'}>
                          <span>
                            <IconButton
                              color='success'
                              size='small'
                              onClick={() => saveBin(binCode)}
                            >
                              <CheckCircleIcon fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={t('inventorySearch.cancel') || 'Cancel'}
                        >
                          <span>
                            <IconButton
                              color='secondary'
                              size='small'
                              onClick={() => cancelEdit(binCode)}
                            >
                              <CancelIcon fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {!empty && (
                          <Tooltip title={t('common.add') || 'Add'}>
                            <span>
                              <IconButton
                                color='primary'
                                size='small'
                                onClick={() => addRow(binCode)}
                              >
                                <AddCircleOutlineIcon fontSize='small' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                </Box>

                <CardContent sx={{ p: 1 }}>
                  <Paper
                    variant='outlined'
                    sx={{
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      borderColor: CELL_BORDER,
                      background: '#fff'
                    }}
                  >
                    {items.map((it, idx) => {
                      const key = it.inventoryID ?? ''
                      const showDivider =
                        idx < items.length - 1 || (editing && !empty)
                      return (
                        <Box
                          key={it.inventoryID ?? `empty-${binCode}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: `1fr ${QTY_COL_WIDTH}px`
                          }}
                        >
                          <Box
                            sx={{
                              borderRight: `1px solid ${CELL_BORDER}`,
                              minHeight: CELL_HEIGHT,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              px: 0.5
                            }}
                          >
                            {editing ? (
                              it.inventoryID ? (
                                <Autocomplete
                                  options={productCodes}
                                  size='small'
                                  value={
                                    (productDraft[key] ??
                                      it.productCode) as string
                                  }
                                  onChange={(_, v) =>
                                    setProductDraft(prev => ({
                                      ...prev,
                                      [key]: v || ''
                                    }))
                                  }
                                  renderInput={params => (
                                    <TextField
                                      {...params}
                                      placeholder='ProductCode'
                                      size='small'
                                      sx={INPUT_SX_LEFT}
                                    />
                                  )}
                                  sx={{ width: '100%' }}
                                />
                              ) : (
                                <Autocomplete
                                  options={productCodes}
                                  size='small'
                                  value={emptyDraft[binCode]?.productCode ?? ''}
                                  onChange={(_, v) =>
                                    setEmptyDraft(prev => ({
                                      ...prev,
                                      [binCode]: {
                                        productCode: v || '',
                                        quantity: prev[binCode]?.quantity ?? ''
                                      }
                                    }))
                                  }
                                  renderInput={params => (
                                    <TextField
                                      {...params}
                                      placeholder='ProductCode'
                                      size='small'
                                      sx={INPUT_SX_LEFT}
                                    />
                                  )}
                                  sx={{ width: '100%' }}
                                />
                              )
                            ) : it.inventoryID ? (
                              <Typography
                                sx={{ fontSize: FONT_SIZE, color: CELL_TEXT }}
                              >
                                {it.productCode}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{ fontSize: FONT_SIZE, color: '#94a3b8' }}
                              />
                            )}
                          </Box>

                          <Box
                            sx={{
                              minHeight: CELL_HEIGHT,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              px: 0.5
                            }}
                          >
                            {editing ? (
                              it.inventoryID ? (
                                <Box
                                  display='flex'
                                  alignItems='center'
                                  gap={0.5}
                                  sx={{
                                    width: '100%',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <TextField
                                    type='number'
                                    size='small'
                                    value={quantityDraft[key] ?? it.quantity}
                                    onChange={e => {
                                      const v = e.target.value
                                      setQuantityDraft(prev => ({
                                        ...prev,
                                        [key]: v === '' ? '' : Number(v)
                                      }))
                                    }}
                                    sx={{
                                      width: QTY_COL_WIDTH - 30,
                                      ...INPUT_SX_CENTER
                                    }}
                                  />
                                  <Tooltip
                                    title={
                                      t('inventorySearch.delete') || 'Delete'
                                    }
                                  >
                                    <span>
                                      <IconButton
                                        color='error'
                                        size='small'
                                        onClick={() => deleteItem(binCode, it)}
                                      >
                                        <DeleteIcon fontSize='small' />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <TextField
                                  type='number'
                                  size='small'
                                  value={emptyDraft[binCode]?.quantity ?? ''}
                                  onChange={e => {
                                    const v = e.target.value
                                    setEmptyDraft(prev => ({
                                      ...prev,
                                      [binCode]: {
                                        productCode:
                                          prev[binCode]?.productCode ?? '',
                                        quantity: v === '' ? '' : Number(v)
                                      }
                                    }))
                                  }}
                                  sx={{
                                    width: QTY_COL_WIDTH - 16,
                                    ...INPUT_SX_CENTER
                                  }}
                                />
                              )
                            ) : it.inventoryID ? (
                              <Typography
                                sx={{
                                  fontSize: FONT_SIZE,
                                  color: CELL_TEXT,
                                  fontWeight: 700
                                }}
                              >
                                {it.quantity}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{ fontSize: FONT_SIZE, color: '#94a3b8' }}
                              />
                            )}
                          </Box>

                          {showDivider && (
                            <Divider sx={{ gridColumn: '1 / -1' }} />
                          )}
                        </Box>
                      )
                    })}

                    {editing &&
                      !empty &&
                      (newRows[binCode] || []).map((row, idx) => (
                        <React.Fragment key={`new-${binCode}-${idx}`}>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: `1fr ${QTY_COL_WIDTH}px`
                            }}
                          >
                            <Box
                              sx={{
                                borderRight: `1px solid ${CELL_BORDER}`,
                                minHeight: CELL_HEIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                px: 0.5
                              }}
                            >
                              <Autocomplete
                                options={productCodes}
                                size='small'
                                value={row.productCode}
                                onChange={(_, v) =>
                                  setNewRow(binCode, idx, {
                                    productCode: v || ''
                                  })
                                }
                                renderInput={params => (
                                  <TextField
                                    {...params}
                                    placeholder='ProductCode'
                                    size='small'
                                    sx={INPUT_SX_LEFT}
                                  />
                                )}
                                sx={{ width: '100%' }}
                              />
                            </Box>
                            <Box
                              sx={{
                                minHeight: CELL_HEIGHT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                px: 0.5
                              }}
                            >
                              <Box
                                display='flex'
                                alignItems='center'
                                gap={0.5}
                                sx={{ width: '100%', justifyContent: 'center' }}
                              >
                                <TextField
                                  type='number'
                                  size='small'
                                  value={row.quantity}
                                  onChange={e => {
                                    const v = e.target.value
                                    setNewRow(binCode, idx, {
                                      quantity: v === '' ? '' : Number(v)
                                    })
                                  }}
                                  sx={{
                                    width: QTY_COL_WIDTH - 30,
                                    ...INPUT_SX_CENTER
                                  }}
                                />
                                <Tooltip title='Remove'>
                                  <span>
                                    <IconButton
                                      color='error'
                                      size='small'
                                      onClick={() => removeNewRow(binCode, idx)}
                                    >
                                      <DeleteIcon fontSize='small' />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>
                          <Divider />
                        </React.Fragment>
                      ))}
                  </Paper>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export default InventoryMobileBinCards
