import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Paper,
  Divider,
  Select,
  MenuItem
} from '@mui/material'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
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
}

type FixedCartRow = {
  inventoryID: string
  productCode: string
  quantity: number
}
type Flow = 'confirm' | 'resolve-duplicates' | 'submitting'

const UnloadConfirm: React.FC<UnloadConfirmProps> = ({
  binCode,
  cartItems,
  onSuccess,
  onError,
  frameless = false
}) => {
  const { unloadCart } = useCart()
  const { fetchInventoriesByBinCode } = useInventory()
  const { inventoriesInCart } = useCartContext()

  const [flow, setFlow] = useState<Flow>('confirm')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [leftList, setLeftList] = useState<FixedCartRow[]>([])
  const [rightList, setRightList] = useState<InventoryItem[]>([])

  const [basePayload, setBasePayload] = useState<
    { inventoryID: string; quantity: number; productCode: string }[]
  >([])
  const [dupCodes, setDupCodes] = useState<string[]>([])
  const [targetsByCode, setTargetsByCode] = useState<
    Record<string, { inventoryID: string; qty: number }[]>
  >({})
  /** code -> 选中的目标（'' = New line / 不合并） */
  const [selectedTarget, setSelectedTarget] = useState<Record<string, string>>(
    {}
  )

  // —— data prep ——
  const cartIdToCode = useMemo(() => {
    const m = new Map<string, string>()
    for (const it of inventoriesInCart || [])
      m.set(it.inventoryID, it.productCode)
    return m
  }, [inventoriesInCart])

  useEffect(() => {
    const normalized: FixedCartRow[] = (cartItems || []).map(ci => ({
      inventoryID: ci.inventoryID,
      productCode:
        (ci.productCode && ci.productCode.trim()) ||
        cartIdToCode.get(ci.inventoryID) ||
        '#',
      quantity: ci.quantity
    }))
    setLeftList(normalized)
  }, [cartItems, cartIdToCode])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetchInventoriesByBinCode(binCode)
        if (!active) return
        setRightList(res?.inventories ?? [])
      } catch {
        if (!active) return
        setRightList([])
      }
    })()
    return () => {
      active = false
    }
  }, [binCode, fetchInventoriesByBinCode])

  const binListByCode = useMemo(() => {
    const map = new Map<string, InventoryItem[]>()
    for (const it of rightList) {
      const arr = map.get(it.productCode) || []
      arr.push(it)
      map.set(it.productCode, arr)
    }
    return map
  }, [rightList])

  // 将要卸入：按 productCode 聚合
  const incomingAgg = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of leftList) {
      m.set(it.productCode, (m.get(it.productCode) || 0) + Number(it.quantity))
    }
    return Array.from(m.entries()).map(([productCode, qty]) => ({
      productCode,
      qty
    }))
  }, [leftList])

  const validate = (): { ok: boolean; message?: string } => {
    if (!leftList.length) return { ok: false, message: 'No items to unload.' }
    for (const it of leftList) {
      if (!it.quantity || it.quantity <= 0)
        return {
          ok: false,
          message: `Quantity must be > 0 for ${it.productCode}.`
        }
    }
    return { ok: true }
  }

  // 首屏：点按钮后检测重复
  const handleConfirm = async () => {
    const v = validate()
    if (!v.ok) {
      setError(v.message || 'Invalid payload.')
      onError?.(v.message)
      return
    }

    const payload = leftList.map(it => ({
      inventoryID: it.inventoryID,
      quantity: it.quantity,
      productCode: it.productCode
    }))

    const dups = Array.from(
      new Set(
        payload
          .filter(p => (binListByCode.get(p.productCode)?.length ?? 0) > 0)
          .map(p => p.productCode)
      )
    )

    if (dups.length === 0) {
      await submitUnload(payload) // 直接提交
      return
    }

    // 重复：准备候选目标（按数量降序）；默认一律“不合并”（空值）
    const targets: Record<string, { inventoryID: string; qty: number }[]> = {}
    const preselect: Record<string, string> = {}
    dups.forEach(code => {
      const items = (binListByCode.get(code) || [])
        .slice()
        .sort((a, b) => b.quantity - a.quantity)
      targets[code] = items.map(i => ({
        inventoryID: i.inventoryID,
        qty: i.quantity
      }))
      preselect[code] = '' // ✅ 默认不合并（即使只有 1 个托盘也可改选）
    })

    setBasePayload(payload)
    setDupCodes(dups)
    setTargetsByCode(targets)
    setSelectedTarget(preselect)
    setFlow('resolve-duplicates')
  }

  // 提交
  const submitUnload = async (
    items:
      | { inventoryID: string; quantity: number; productCode: string }[]
      | {
          inventoryID: string
          quantity: number
          merge?: boolean
          targetInventoryID?: string
        }[]
  ) => {
    setError(null)
    setSubmitting(true)
    setFlow('submitting')
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
        const msg = res?.error || 'Failed to unload items.'
        setError(msg)
        onError?.(msg)
        setFlow('confirm')
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to unload items.'
      setError(msg)
      onError?.(msg)
      setFlow('confirm')
    } finally {
      setSubmitting(false)
    }
  }

  const submitPerProductDecisions = async () => {
    const dupSet = new Set(dupCodes)
    const finalItems = basePayload.map(p => {
      if (!dupSet.has(p.productCode)) {
        return { inventoryID: p.inventoryID, quantity: p.quantity }
      }
      const target = selectedTarget[p.productCode] || ''
      if (!target) return { inventoryID: p.inventoryID, quantity: p.quantity } // keep separate
      return {
        inventoryID: p.inventoryID,
        quantity: p.quantity,
        merge: true,
        targetInventoryID: target
      }
    })
    await submitUnload(finalItems)
  }

  // —— UI —— //

  const panePaperSx = {
    p: 1,
    borderRadius: 2,
    mb: 1,
    borderColor: 'primary.main',
    borderWidth: 1.5,
    borderStyle: 'solid',
    bgcolor: '#e3f2fd'
  } as const

  const smallCardSx = {
    p: 0.7,
    borderRadius: 2,
    borderColor: 'primary.main',
    bgcolor: '#e3f2fd'
  } as const

  const selectSx = {
    height: 34,
    minWidth: 220,
    borderRadius: 2,
    bgcolor: '#f0f4f8',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
      borderWidth: 2
    }
  } as const

  /** 上半：每个产品一行（重复 → 下拉；非重复 → 静态文案） */
  const ReadyRow: React.FC<{ code: string; qty: number }> = ({ code, qty }) => {
    const cands = targetsByCode[code] || []
    const hasDup = cands.length > 0
    const value = selectedTarget[code] ?? ''

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          columnGap: 0.75,
          rowGap: 0.25
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={700} fontSize={12} noWrap>
            #{code}
          </Typography>
          <Typography fontSize={11} color='text.secondary'>
            Incoming: {qty}
          </Typography>
        </Box>

        {!hasDup ? (
          // 不在 bin 中 → 只能新建行
          <Typography fontSize={12} color='text.secondary'>
            New line (keep separate)
          </Typography>
        ) : (
          // 在 bin 中 → 下拉可选：New line / Pallet • Qty …
          <Select
            size='small'
            value={value}
            onChange={e =>
              setSelectedTarget(prev => ({
                ...prev,
                [code]: String(e.target.value)
              }))
            }
            displayEmpty
            sx={selectSx}
            renderValue={val => {
              if (!val) return 'New line (keep separate)'
              const cand = cands.find(c => c.inventoryID === val)
              return cand ? `Merge to • Qty ${cand.qty}` : 'Select…'
            }}
            MenuProps={{ PaperProps: { sx: { borderRadius: 2 } } }}
          >
            <MenuItem value=''>
              <Typography fontSize={13}>New line (keep separate)</Typography>
            </MenuItem>
            {cands.map(c => (
              <MenuItem key={c.inventoryID} value={c.inventoryID}>
                <Typography fontSize={13}>Pallet • Qty {c.qty}</Typography>
              </MenuItem>
            ))}
          </Select>
        )}
      </Box>
    )
  }

  const Content = (
    <Box sx={{ p: frameless ? 0 : 0 }}>
      {/* 首屏：一个大按钮 */}
      {flow === 'confirm' && (
        <>
          {!frameless && <Divider sx={{ mb: 1 }} />}
          {error && (
            <Typography color='error' textAlign='center' sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            variant='contained'
            color='primary'
            fullWidth
            disabled={submitting || leftList.length === 0}
            onClick={handleConfirm}
            sx={{
              height: 64,
              fontWeight: 800,
              borderRadius: 999,
              textTransform: 'none',
              fontSize: 18
            }}
          >
            Unload to {binCode}
          </Button>
        </>
      )}

      {/* 有重复：两块（上：决定目标；下：bin 库存） */}
      {flow === 'resolve-duplicates' && (
        <>
          <Typography variant='body2' fontWeight={800}>
            Unload to <b>{binCode}</b>
          </Typography>

          {/* 上：准备卸货（每行一个选择） */}
          <Paper variant='outlined' sx={panePaperSx}>
            <Typography fontWeight={800} fontSize={12} sx={{ mb: 0.5 }}>
              Ready to unload
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {incomingAgg.map(({ productCode, qty }) => (
                <ReadyRow key={productCode} code={productCode} qty={qty} />
              ))}
            </Box>
          </Paper>

          {/* 箭头 */}
          <Box display='flex' justifyContent='center' sx={{ my: 0.5 }}>
            <ArrowDownwardIcon
              fontSize='small'
              sx={{ color: 'primary.main' }}
            />
          </Box>

          {/* 下：目标 bin 全量库存 */}
          <Paper variant='outlined' sx={panePaperSx}>
            <Typography fontWeight={800} fontSize={12} sx={{ mb: 0.5 }}>
              Bin {binCode} inventory
            </Typography>

            {rightList.length === 0 ? (
              <Typography fontSize={12} color='text.secondary'>
                Empty.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                  gap: 0.6,
                  maxHeight: 220,
                  overflowY: 'auto'
                }}
              >
                {rightList.map(i => (
                  <Paper
                    key={i.inventoryID}
                    variant='outlined'
                    sx={smallCardSx}
                  >
                    <Typography fontWeight={700} fontSize={12} noWrap>
                      #{i.productCode}
                    </Typography>
                    <Typography fontSize={11} color='text.secondary'>
                      Qty {i.quantity}
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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.1,
              mt: 1.2
            }}
          >
            <Button
              variant='outlined'
              onClick={() => setFlow('confirm')}
              disabled={submitting}
              sx={{
                height: 46,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700
              }}
            >
              Back
            </Button>
            <Button
              variant='contained'
              onClick={submitPerProductDecisions}
              disabled={submitting}
              sx={{
                height: 46,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 800
              }}
            >
              Unload
            </Button>
          </Box>
        </>
      )}

      {flow === 'submitting' && (
        <Typography textAlign='center' color='text.secondary'>
          Processing…
        </Typography>
      )}
    </Box>
  )

  if (frameless) return Content

  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 2,
        background: '#fff',
        boxShadow: '0 2px 6px #00000010'
      }}
    >
      <CardContent sx={{ p: 2 }}>{Content}</CardContent>
    </Card>
  )
}

export default UnloadConfirm
