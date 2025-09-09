import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { useInventory } from 'hooks/useInventory'
import { useCartContext } from 'contexts/cart'
import { InventoryItem } from 'types/inventory'

type CartItem = { inventoryID: string; productCode?: string; quantity: number }

interface UnloadConfirmProps {
  binCode: string
  cartItems: CartItem[]
  onSuccess?: () => void
  onError?: (msg?: string) => void
  frameless?: boolean
  /** 父组件预取到的 bin 库存，传入即“秒开” */
  initialBinInventories?: InventoryItem[]
}

type FixedCartRow = {
  inventoryID: string
  productCode: string
  quantity: number
}

type PillOption = { value: string; label: string }

const PillSelect = React.memo(function PillSelect({
  value,
  options,
  onChange,
  placeholder,
  accent = false
}: {
  value: string
  options: PillOption[]
  onChange: (v: string) => void
  placeholder: string
  accent?: boolean
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const current = options.find(o => o.value === value)?.label || placeholder

  const baseStyles = accent
    ? {
        bgcolor: '#E8F5E9',
        borderColor: '#2E7D32',
        color: '#1B5E20',
        '&:hover': { bgcolor: '#C8E6C9', borderColor: '#2E7D32' }
      }
    : {
        bgcolor: '#f0f4f8',
        borderColor: '#90caf9',
        color: 'text.primary',
        '&:hover': { bgcolor: '#e8f2ff', borderColor: '#64b5f6' }
      }

  return (
    <>
      <Button
        onClick={e => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
        sx={{
          height: 32,
          minWidth: 140,
          justifyContent: 'space-between',
          px: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: 13,
          fontWeight: 700,
          border: '1px solid',
          boxShadow: 'none',
          ...baseStyles
        }}
      >
        {current}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 2,
            mt: 0.5,
            minWidth: 180,
            '& .MuiMenuItem-root': { fontSize: 14, py: 1 }
          }
        }}
      >
        {options.map(opt => (
          <MenuItem
            key={opt.value}
            selected={opt.value === value}
            onClick={() => {
              onChange(opt.value)
              setAnchorEl(null)
            }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
})

const UnloadConfirm: React.FC<UnloadConfirmProps> = ({
  binCode,
  cartItems,
  onSuccess,
  onError,
  frameless = false,
  initialBinInventories
}) => {
  const { t } = useTranslation()
  const { unloadCart } = useCart()
  const { fetchInventoriesByBinCode } = useInventory()
  const { inventoriesInCart } = useCartContext()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [leftList, setLeftList] = useState<FixedCartRow[]>([])
  const [rightList, setRightList] = useState<InventoryItem[]>(
    initialBinInventories ?? []
  )
  const [binLoaded, setBinLoaded] = useState<boolean>(!!initialBinInventories)
  const [selectedTarget, setSelectedTarget] = useState<Record<string, string>>(
    {}
  )

  // 读取默认扫描模式，控制卡片内部最大高度
  const scanMode = (localStorage.getItem('scanMode') || 'gun') as
    | 'camera'
    | 'gun'
  const cardBodyMaxH = scanMode === 'camera' ? '68vh' : '80vh'

  /** 由 cartItems + context 规范化左侧列表（逐条渲染，不聚合） */
  useEffect(() => {
    const idToCode = new Map<string, string>()
    for (const it of inventoriesInCart || [])
      idToCode.set(it.inventoryID, it.productCode)

    const normalized: FixedCartRow[] = (cartItems || []).map(ci => ({
      inventoryID: ci.inventoryID,
      productCode:
        (ci.productCode && ci.productCode.trim()) ||
        idToCode.get(ci.inventoryID) ||
        '#',
      quantity: ci.quantity
    }))
    setLeftList(normalized)
  }, [cartItems, inventoriesInCart])

  /** 若父组件未预取，则内部自行拉取，并显示加载转圈 */
  useEffect(() => {
    if (initialBinInventories) return
    let active = true
    setBinLoaded(false)
    ;(async () => {
      try {
        const res = await fetchInventoriesByBinCode(binCode)
        if (active) setRightList(res?.inventories ?? [])
      } catch {
        if (active) setRightList([])
      } finally {
        if (active) setBinLoaded(true)
      }
    })()
    return () => {
      active = false
    }
  }, [binCode, fetchInventoriesByBinCode, initialBinInventories])

  /** bin 内按 productCode 建索引，用于生成“合并”目标 */
  const binListByCode = useMemo(() => {
    if (!binLoaded || rightList.length === 0)
      return new Map<string, InventoryItem[]>()
    const map = new Map<string, InventoryItem[]>()
    for (const it of rightList) {
      const arr = map.get(it.productCode) || []
      arr.push(it)
      map.set(it.productCode, arr)
    }
    return map
  }, [binLoaded, rightList])

  /** 左侧逐条数据（不聚合） */
  const incomingRows = useMemo(
    () =>
      leftList.map(it => ({
        inventoryID: it.inventoryID,
        productCode: it.productCode,
        qty: it.quantity
      })),
    [leftList]
  )

  /** 每个 productCode 的可合并候选（显示为下拉） */
  const targetsByCode = useMemo(() => {
    if (!binLoaded || leftList.length === 0)
      return {} as Record<string, { inventoryID: string; qty: number }[]>
    const map: Record<string, { inventoryID: string; qty: number }[]> = {}
    const codes = new Set(leftList.map(i => i.productCode))
    codes.forEach(code => {
      const items = (binListByCode.get(code) || [])
        .slice()
        .sort((a, b) => b.quantity - a.quantity)
      map[code] = items.map(i => ({
        inventoryID: i.inventoryID,
        qty: i.quantity
      }))
    })
    return map
  }, [binLoaded, leftList, binListByCode])

  const setTarget = useCallback((invId: string, v: string) => {
    setSelectedTarget(prev => ({ ...prev, [invId]: v }))
  }, [])

  const submitUnload = async (
    items:
      | { inventoryID: string; quantity: number }[]
      | {
          inventoryID: string
          quantity: number
          merge?: boolean
          targetInventoryID?: string
        }[]
  ) => {
    setError(null)
    setSubmitting(true)
    try {
      const clean = (items as any[]).map(it => {
        const base = { inventoryID: it.inventoryID, quantity: it.quantity }
        return it.merge
          ? { ...base, merge: true, targetInventoryID: it.targetInventoryID }
          : base
      })
      const res = await unloadCart(binCode, clean)
      if (res?.success) onSuccess?.()
      else {
        const msg = res?.error || t('unload.error')
        setError(msg)
        onError?.(msg)
      }
    } catch (e: any) {
      const msg = e?.message || t('unload.error')
      setError(msg)
      onError?.(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const submitPerProductDecisions = async () => {
    const finalItems = incomingRows.map(row => {
      const hasDup = (targetsByCode[row.productCode]?.length || 0) > 0
      const pick = selectedTarget[row.inventoryID] || ''
      if (!hasDup || !pick)
        return { inventoryID: row.inventoryID, quantity: row.qty }
      return {
        inventoryID: row.inventoryID,
        quantity: row.qty,
        merge: true,
        targetInventoryID: pick
      }
    })
    await submitUnload(finalItems)
  }

  const panePaperSx = {
    p: 1,
    borderRadius: 2,
    mb: 1,
    borderColor: 'primary.main',
    borderWidth: 1.5,
    borderStyle: 'solid',
    bgcolor: '#f0f6ff'
  } as const

  const panePaperReadonlySx = {
    p: 1,
    borderRadius: 2,
    mb: 1,
    borderColor: '#cfd8dc',
    borderWidth: 1.5,
    borderStyle: 'solid',
    bgcolor: '#f5f7f9'
  } as const

  const smallCardReadonlySx = {
    p: 0.7,
    borderRadius: 2,
    borderColor: '#cfd8dc',
    bgcolor: '#eef1f4',
    color: 'text.secondary'
  } as const

  /** 行组件（只在需要合并的行显示绿色下拉） */
  const ReadyRow = React.memo(function ReadyRow({
    inventoryID,
    code,
    qty
  }: {
    inventoryID: string
    code: string
    qty: number
  }) {
    const cands = targetsByCode[code] || []
    const hasDup = cands.length > 0
    const value = selectedTarget[inventoryID] ?? ''

    const options: PillOption[] = hasDup
      ? [
          { value: '', label: t('unload.singlePallet') },
          ...cands.map(c => ({
            value: c.inventoryID,
            label: t('unload.palletQty', { qty: c.qty })
          }))
        ]
      : []

    return (
      <Paper variant='outlined' sx={{ ...smallCardReadonlySx, p: 0.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            columnGap: 0.75
          }}
        >
          <Typography fontWeight={700} fontSize={12} noWrap>
            #{code} · {t('common.qty', { qty })}
          </Typography>

          {hasDup ? (
            <PillSelect
              value={value}
              options={options}
              onChange={v => setTarget(inventoryID, v)}
              placeholder={t('unload.singlePallet')}
              accent
            />
          ) : null}
        </Box>
      </Paper>
    )
  })

  /** 内容（可滚动体 + 底部固定操作区） */
  const ScrollBody = (
    <Box sx={{ flex: 1, overflowY: 'auto' }}>
      {!binLoaded ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          {/* 左：待卸清单 */}
          <Paper variant='outlined' sx={panePaperSx}>
            <Typography
              fontWeight={800}
              fontSize={12}
              sx={{ mb: 0.5 }}
              align='center'
            >
              {t('unload.title')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {incomingRows.map(row => (
                <ReadyRow
                  key={row.inventoryID}
                  inventoryID={row.inventoryID}
                  code={row.productCode}
                  qty={row.qty}
                />
              ))}
            </Box>
          </Paper>

          <Box display='flex' justifyContent='center' sx={{ my: 0.5 }}>
            <ArrowDownwardIcon
              fontSize='small'
              sx={{ color: 'primary.main' }}
            />
          </Box>

          {/* 右：货位当前库存 */}
          <Paper variant='outlined' sx={panePaperReadonlySx}>
            <Typography
              fontWeight={800}
              fontSize={12}
              sx={{ mb: 0.5, color: 'text.secondary' }}
              align='center'
            >
              {t('unload.binInventory', { binCode })}
            </Typography>

            {rightList.length === 0 ? (
              <Typography fontSize={12} color='text.secondary' align='center'>
                {t('unload.empty')}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                  gap: 0.6
                }}
              >
                {rightList.map(i => (
                  <Paper
                    key={i.inventoryID}
                    variant='outlined'
                    sx={smallCardReadonlySx}
                  >
                    <Typography
                      fontWeight={700}
                      fontSize={12}
                      noWrap
                      color='text.secondary'
                    >
                      #{i.productCode} · {t('common.qty', { qty: i.quantity })}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>

          {error && (
            <Typography color='error' textAlign='center' sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  )

  const Footer = (
    <Box
      sx={{
        pt: 1,
        background: '#fff',
        borderTop: '1px solid #eef0f3',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1.1
      }}
    >
      <Button
        variant='outlined'
        onClick={() => window.history.back()}
        disabled={submitting}
        sx={{
          height: 44,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700
        }}
      >
        {t('unload.back')}
      </Button>
      <Button
        variant='contained'
        onClick={submitPerProductDecisions}
        disabled={submitting}
        sx={{
          height: 44,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 800
        }}
      >
        {submitting ? t('unload.unloading') : t('unload.unload')}
      </Button>
    </Box>
  )

  const Inner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: cardBodyMaxH
      }}
    >
      {ScrollBody}
      {Footer}
    </Box>
  )

  if (frameless) return <Box sx={{ p: 0 }}>{Inner}</Box>

  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 2,
        background: '#fff',
        boxShadow: '0 2px 6px #00000010'
      }}
    >
      <CardContent sx={{ p: 2 }}>{Inner}</CardContent>
    </Card>
  )
}

export default UnloadConfirm
