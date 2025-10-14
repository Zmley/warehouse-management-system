// pages/MobileScanConfirm.tsx
import React, { useMemo, useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import EditIcon from '@mui/icons-material/Edit'
import ScanPanelLite from './ScanPanelLite'

/** 供主页面传入的 Pending 精简类型 */
export type PendingLite = {
  transferID: string
  productCode: string
  quantity: number
}

export type ConfirmItem = {
  transferID: string
  productCode: string
  quantity: number
}

type ConfirmLine = {
  transferID?: string
  productCode: string
  expectedQty: number | null
  confirmQty: number | ''
}

function parseMultiPairs(
  raw: string
): Array<{ productCode: string; qty: number }> {
  const text = (raw || '').trim()
  if (!text) return []
  return text
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const [c, q] = pair.split(':').map(x => x?.trim())
      const qty = Number(q)
      if (c && Number.isFinite(qty)) return { productCode: c, qty }
      return null
    })
    .filter(Boolean) as Array<{ productCode: string; qty: number }>
}

export default function MobileScanConfirm({
  open,
  onClose,
  pending,
  fetchProduct,
  confirmReceive,
  onConfirmedSuccess,
  onError
}: {
  open: boolean
  onClose: () => void
  pending: PendingLite[]
  fetchProduct: (barcode: string) => Promise<{ productCode?: string } | null>
  confirmReceive: (
    items: ConfirmItem[]
  ) => Promise<{ success: boolean; message?: string }>
  onConfirmedSuccess: (confirmedIDs: string[]) => void
  onError?: (msg: string) => void
}) {
  const [scanOpen, setScanOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [lines, setLines] = useState<ConfirmLine[]>([])

  /** 外层控制：打开时默认先进入“扫描” */
  React.useEffect(() => {
    if (open) {
      setScanOpen(true)
      setConfirmOpen(false)
      setLines([])
    }
  }, [open])

  const byCode = useMemo(() => {
    const m = new Map<string, PendingLite>()
    pending.forEach(p => m.set(p.productCode, p))
    return m
  }, [pending])

  const openConfirmForPairs = (
    pairs: Array<{ productCode: string; qty: number }>
  ) => {
    const arr: ConfirmLine[] = []
    pairs.forEach(({ productCode, qty }) => {
      const row = byCode.get(productCode)
      if (row) {
        arr.push({
          transferID: row.transferID,
          productCode,
          expectedQty: row.quantity,
          confirmQty: qty
        })
      } else {
        arr.push({ productCode, expectedQty: null, confirmQty: qty })
      }
    })
    setLines(arr)
    setConfirmOpen(true)
  }

  const handleScanned = async (text: string) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    const pairs = parseMultiPairs(trimmed)
    if (pairs.length > 0) {
      setScanOpen(false)
      openConfirmForPairs(pairs)
      return
    }
    try {
      const p = await fetchProduct(trimmed)
      const code = p?.productCode || trimmed
      setScanOpen(false)
      setLines([
        {
          productCode: code,
          expectedQty: byCode.get(code)?.quantity ?? null,
          confirmQty: ''
        }
      ])
      setConfirmOpen(true)
    } catch {
      setScanOpen(false)
      setLines([{ productCode: trimmed, expectedQty: null, confirmQty: '' }])
      setConfirmOpen(true)
    }
  }

  const submitConfirm = async () => {
    if (confirmBusy) return
    for (const l of lines) {
      if (l.confirmQty === '' || Number(l.confirmQty) <= 0) {
        onError?.('请输入有效的确认数量。')
        return
      }
    }
    setConfirmBusy(true)
    try {
      const items: ConfirmItem[] = lines
        .filter(l => !!l.transferID)
        .map(l => ({
          transferID: l.transferID as string,
          productCode: l.productCode,
          quantity: Number(l.confirmQty)
        }))

      if (items.length > 0) {
        const res = await confirmReceive(items)
        if (!res?.success) {
          onError?.(res?.message || '确认收货失败')
          return
        }
      }

      onConfirmedSuccess(items.map(i => i.transferID))
      setConfirmOpen(false)
      onClose()
    } finally {
      setConfirmBusy(false)
    }
  }

  // 容器：占满屏（遮罩交给上层控制 open）
  if (!open) return null

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 2100 }}>
      {/* 扫描 Drawer */}
      <Drawer
        anchor='bottom'
        open={scanOpen}
        onClose={() => {
          setScanOpen(false)
          onClose()
        }}
        PaperProps={{
          sx: {
            p: 1,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            maxHeight: '70vh'
          }
        }}
      >
        <ScanPanelLite
          onScanned={(text: string) => handleScanned(text)}
          onClose={() => {
            setScanOpen(false)
            onClose()
          }}
          placeholder='支持：条形码 / 多对 PRODUCT:QTY'
        />
      </Drawer>

      {/* 确认全屏 */}
      {confirmOpen && (
        <ConfirmFullscreen
          lines={lines}
          busy={confirmBusy}
          onChangeLine={(idx, val) =>
            setLines(prev =>
              prev.map((x, i) => (i === idx ? { ...x, confirmQty: val } : x))
            )
          }
          onClose={() => {
            setConfirmOpen(false)
            onClose()
          }}
          onSubmit={submitConfirm}
        />
      )}
    </Box>
  )
}

/* =============== 确认全屏 & 行 =============== */

function ConfirmFullscreen({
  lines,
  busy,
  onChangeLine,
  onClose,
  onSubmit
}: {
  lines: ConfirmLine[]
  busy: boolean
  onChangeLine: (index: number, val: number | '') => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <Box
      role='dialog'
      aria-label='确认收货'
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: '#fff',
        zIndex: 2200,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 1, pt: 1.25 }}>
        <Box
          sx={{
            width: 44,
            height: 4,
            bgcolor: '#cbd5e1',
            borderRadius: 999,
            mx: 'auto',
            mb: 1
          }}
        />
        <Typography
          sx={{ fontWeight: 900, fontSize: 16, textAlign: 'left', px: 0.2 }}
        >
          确认收货
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: '100px' }}>
        {lines.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant='body2'>暂无需要确认的项目</Typography>
          </Box>
        ) : (
          lines.map((l, idx) => (
            <ConfirmLineRow
              key={`${l.productCode}-${idx}`}
              line={l}
              onChange={val => onChangeLine(idx, val)}
            />
          ))
        )}
      </Box>

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#fff',
          borderTop: '1px solid #e2e8f0',
          p: 1,
          pt: 0.75,
          pb: 'max(12px, env(safe-area-inset-bottom))',
          boxShadow: '0 -6px 16px rgba(2,6,23,0.06)'
        }}
      >
        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            fullWidth
            onClick={onClose}
            disabled={busy}
            sx={{ fontWeight: 800 }}
          >
            取消
          </Button>
          <Button
            variant='contained'
            color='primary'
            fullWidth
            onClick={onSubmit}
            disabled={busy || lines.length === 0}
            startIcon={busy ? <CircularProgress size={16} /> : <DoneAllIcon />}
            sx={{ fontWeight: 800 }}
          >
            确认收货
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

function ConfirmLineRow({
  line,
  onChange
}: {
  line: ConfirmLine
  onChange: (val: number | '') => void
}) {
  const showMatch =
    line.expectedQty != null &&
    line.confirmQty !== '' &&
    Number(line.confirmQty) === line.expectedQty

  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.25,
        px: 0.75,
        py: 0.45,
        mb: 0.55,
        bgcolor: '#fff'
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto 96px auto',
          alignItems: 'center',
          columnGap: 0.75
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            fontFamily: 'ui-monospace,Menlo,Consolas,"Courier New",monospace',
            fontSize: 14,
            color: '#0f172a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={line.productCode}
        >
          {line.productCode}
        </Typography>

        <Box
          sx={{
            border: '1px solid #e5e7eb',
            borderRadius: 1,
            px: 0.6,
            py: 0.35,
            bgcolor: '#f8fafc',
            minWidth: 72,
            textAlign: 'center'
          }}
          title='应收数量'
        >
          <Typography variant='caption' sx={{ color: '#64748b', mr: 0.3 }}>
            应收
          </Typography>
          <Typography component='span' sx={{ fontWeight: 900 }}>
            {line.expectedQty ?? '--'}
          </Typography>
        </Box>

        <TextField
          size='small'
          label='确认'
          value={line.confirmQty}
          onChange={e => {
            const v = e.target.value.trim()
            if (v === '') return onChange('')
            const n = Math.max(0, Math.floor(Number(v)))
            onChange(Number.isFinite(n) ? n : '')
          }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <EditIcon sx={{ fontSize: 16, color: '#64748b' }} />
              </InputAdornment>
            )
          }}
        />

        {showMatch ? (
          <Chip
            size='small'
            color='success'
            label='匹配成功'
            variant='outlined'
            sx={{ height: 22, fontSize: 11, fontWeight: 800 }}
          />
        ) : (
          <Chip
            size='small'
            label='—'
            variant='outlined'
            sx={{
              height: 22,
              fontSize: 11,
              color: '#94a3b8',
              borderColor: '#e2e8f0'
            }}
          />
        )}
      </Box>
    </Box>
  )
}
