// pages/MobileReceive.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Drawer,
  Snackbar,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import { TransferStatusUI } from 'constants/index'
import { useTransfer } from 'hooks/useTransfer'
import { useParams } from 'react-router-dom'
import { useAuth } from 'hooks/useAuth'
import { useProduct } from 'hooks/useProduct'
import ScanPanelLite from './ScanPanelLite'

type TransferRow = {
  transferID: string
  productCode: string
  quantity: number
  status: TransferStatusUI
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

type ConfirmLine = {
  transferID?: string
  productCode: string
  expectedQty: number | null
  confirmQty: number | ''
  ok?: boolean
}

export default function MobileReceive({
  warehouseID: propWarehouseID
}: {
  warehouseID?: string
}) {
  const params = useParams<{ warehouseID?: string }>()
  const { userProfile } = useAuth()
  const { fetchProduct } = useProduct()

  const resolvedWarehouseID =
    propWarehouseID || params.warehouseID || userProfile?.warehouseID || ''

  // useTransfer（两个实例用于分别取 PENDING / IN_PROCESS 列表）
  const {
    getTransfers: getPending,
    isLoading: loadingP,
    transfers: transfersP,
    handleConfirmReceive // ⬅️ 用于确认收货
  } = useTransfer()
  const {
    getTransfers: getInProcess,
    isLoading: loadingI,
    transfers: transfersI
  } = useTransfer()

  const [updating, setUpdating] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [snack, setSnack] = useState<{
    open: boolean
    msg: string
    sev: 'success' | 'error' | 'info'
  }>({ open: false, msg: '', sev: 'info' })

  const [pending, setPending] = useState<TransferRow[]>([])
  const [inProcess, setInProcess] = useState<TransferRow[]>([])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLines, setConfirmLines] = useState<ConfirmLine[]>([])
  const [confirmBusy, setConfirmBusy] = useState(false)

  const load = useCallback(async () => {
    if (!resolvedWarehouseID) return
    setUpdating(true)
    try {
      await Promise.all([
        getPending({
          warehouseID: resolvedWarehouseID,
          status: 'PENDING',
          page: 1,
          limit: 200
        }),
        getInProcess({
          warehouseID: resolvedWarehouseID,
          status: 'IN_PROCESS',
          page: 1,
          limit: 200
        })
      ])
    } finally {
      setUpdating(false)
    }
  }, [resolvedWarehouseID, getPending, getInProcess])

  useEffect(() => {
    setPending(
      ((transfersP as any[]) || []).map(t => ({
        transferID: t.transferID,
        productCode: t.productCode,
        quantity: Number(t.quantity || 0),
        status: 'PENDING'
      }))
    )
  }, [transfersP])

  useEffect(() => {
    setInProcess(
      ((transfersI as any[]) || []).map(t => ({
        transferID: t.transferID,
        productCode: t.productCode,
        quantity: Number(t.quantity || 0),
        status: 'IN_PROCESS'
      }))
    )
  }, [transfersI])

  useEffect(() => {
    if (resolvedWarehouseID) load()
  }, [resolvedWarehouseID, load])

  const onRefresh = () => resolvedWarehouseID && load()

  // 扫描后打开确认 Drawer（批量）
  const openConfirmForPairs = (
    pairs: Array<{ productCode: string; qty: number }>
  ) => {
    const byCode = new Map<string, number>()
    pairs.forEach(p => byCode.set(p.productCode, p.qty))

    const lines: ConfirmLine[] = []
    const remain: TransferRow[] = []

    for (const row of pending) {
      const qty = byCode.get(row.productCode)
      if (typeof qty === 'number') {
        lines.push({
          transferID: row.transferID,
          productCode: row.productCode,
          expectedQty: row.quantity,
          confirmQty: qty,
          ok: qty === row.quantity
        })
        byCode.delete(row.productCode)
      } else {
        remain.push(row)
      }
    }

    for (const [code, qty] of byCode.entries()) {
      lines.push({
        productCode: code,
        expectedQty: null,
        confirmQty: qty,
        ok: undefined
      })
    }

    setConfirmLines(lines)
    setConfirmOpen(true)
  }

  // 扫描处理（条码或多对 PRODUCT:QTY）
  const handleScanned = async (text: string) => {
    const trimmed = (text || '').trim()
    if (!trimmed) {
      setSnack({ open: true, msg: '无效的扫描内容。', sev: 'error' })
      return
    }

    const pairs = parseMultiPairs(trimmed)
    if (pairs.length > 0) {
      setScanOpen(false)
      openConfirmForPairs(pairs)
      return
    }

    try {
      const p = await fetchProduct(trimmed) // 单条码 -> 找 productCode
      const code = p?.productCode || trimmed
      setScanOpen(false)
      setConfirmLines([
        { productCode: code, expectedQty: null, confirmQty: '', ok: undefined }
      ])
      setConfirmOpen(true)
    } catch {
      setScanOpen(false)
      setConfirmLines([
        {
          productCode: trimmed,
          expectedQty: null,
          confirmQty: '',
          ok: undefined
        }
      ])
      setConfirmOpen(true)
    }
  }

  // 点击“确认收货”按钮：调用 hook，并本地移动到 In Process
  const submitConfirm = async () => {
    if (confirmBusy) return

    // 基本校验
    for (const l of confirmLines) {
      if (l.confirmQty === '' || Number(l.confirmQty) <= 0) {
        setSnack({ open: true, msg: '请输入有效的确认数量。', sev: 'error' })
        return
      }
    }

    setConfirmBusy(true)
    try {
      // 仅提交有 transferID 的项目（任务内的行）
      const items = confirmLines
        .filter(l => !!l.transferID)
        .map(l => ({
          transferID: l.transferID as string,
          productCode: l.productCode,
          quantity: Number(l.confirmQty)
        }))

      if (items.length > 0) {
        const res = await handleConfirmReceive(items)
        if (!res?.success) {
          setSnack({
            open: true,
            msg: res?.message || '确认收货失败',
            sev: 'error'
          })
          return
        }
      }

      // 本地把这些行移到 In Process
      const confirmedIDs = new Set(items.map(i => i.transferID))
      const moved: TransferRow[] = []
      const remain: TransferRow[] = []
      for (const r of pending) {
        if (confirmedIDs.has(r.transferID)) {
          moved.push({ ...r, status: 'IN_PROCESS' })
        } else {
          remain.push(r)
        }
      }
      setPending(remain)
      setInProcess(prev => [...moved, ...prev])

      setSnack({
        open: true,
        msg: '已确认收货，项目进入 In Process。',
        sev: 'success'
      })
      setConfirmOpen(false)
      setConfirmLines([])
    } finally {
      setConfirmBusy(false)
    }
  }

  const counts = useMemo(
    () => ({ p: pending.length, i: inProcess.length }),
    [pending.length, inProcess.length]
  )
  const busy = updating || loadingP || loadingI

  // Drawer 高度随条目数变化（最小 40vh，最大 88vh）
  const confirmDrawerHeight = useMemo(
    () => `clamp(40vh, calc(28vh + ${confirmLines.length} * 12vh), 88vh)`,
    [confirmLines.length]
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f6f7fb',
        px: 1,
        py: 1,
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1120,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 2,
            border: '1px solid #e6ebf2',
            bgcolor: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Button
              size='small'
              variant='outlined'
              startIcon={<QrCodeScannerIcon />}
              onClick={() => setScanOpen(true)}
              disabled={!resolvedWarehouseID || busy}
              sx={{ textTransform: 'none', fontWeight: 800, px: 1.25, py: 0.4 }}
            >
              扫描
            </Button>
            <IconButton
              size='small'
              onClick={onRefresh}
              disabled={!resolvedWarehouseID}
            >
              {busy ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon fontSize='small' />
              )}
            </IconButton>
          </Box>
        </Paper>

        {/* 左右两列 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            height: 'calc(100vh - 180px)'
          }}
        >
          <Panel
            title='Pending'
            count={counts.p}
            headerBg='#f1f5f9'
            headerBorder='#e5e7eb'
            bodyBorder='#e5e7eb'
            emptyText='暂无 Pending 项'
          >
            {busy ? (
              <BusyOverlay />
            ) : pending.length === 0 ? (
              <Empty text='暂无 Pending 项' />
            ) : (
              pending.map(row => (
                <RowCard
                  key={row.transferID}
                  code={row.productCode}
                  qty={row.quantity}
                  hint='等待扫描确认'
                />
              ))
            )}
          </Panel>

          <Panel
            title='In Process'
            count={counts.i}
            headerBg='#dcfce7'
            headerBorder='#bbf7d0'
            bodyBorder='#bbf7d0'
            titleColor='#14532d'
            emptyText='暂无 In Process 项'
          >
            {inProcess.length === 0 ? (
              <Empty text='暂无 In Process 项' />
            ) : (
              inProcess.map(row => (
                <RowCard
                  key={row.transferID}
                  code={row.productCode}
                  qty={row.quantity}
                  hint='已扫描'
                  ok
                />
              ))
            )}
          </Panel>
        </Box>
      </Box>

      {/* 扫描 Drawer */}
      <Drawer
        anchor='bottom'
        open={scanOpen}
        onClose={() => setScanOpen(false)}
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
          onClose={() => setScanOpen(false)}
          placeholder='支持：1) 条形码；2) 多对 PRODUCT:QTY（逗号/换行/分号分隔）'
        />
      </Drawer>

      {/* 确认收货 Drawer（带底部蓝色按钮，zIndex 提升） */}
      <Drawer
        anchor='bottom'
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            position: 'relative',
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            height: confirmDrawerHeight,
            minHeight: '40vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 2000
          }
        }}
        slotProps={{ backdrop: { sx: { zIndex: 1999 } } }}
      >
        {/* 抓手 + 标题 */}
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
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
            确认收货
          </Typography>
        </Box>

        {/* 列表（内部滚动，给底部按钮留空） */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: '120px' }}>
          {confirmLines.length === 0 ? (
            <Empty text='暂无需要确认的项目' />
          ) : (
            confirmLines.map((l, idx) => (
              <ConfirmLineRow
                key={`${l.productCode}-${idx}`}
                line={l}
                onChange={val =>
                  setConfirmLines(prev =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, confirmQty: val } : x
                    )
                  )
                }
              />
            ))
          )}
        </Box>

        {/* 固定底部操作条（蓝色确认） */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: '#fff',
            borderTop: '1px solid #e2e8f0',
            p: 1,
            pt: 0.75,
            pb: 'max(12px, env(safe-area-inset-bottom))',
            boxShadow: '0 -6px 16px rgba(2,6,23,0.06)',
            zIndex: 2001
          }}
        >
          <Stack direction='row' spacing={1}>
            <Button
              variant='outlined'
              fullWidth
              onClick={() => setConfirmOpen(false)}
              disabled={confirmBusy}
              sx={{ fontWeight: 800 }}
            >
              取消
            </Button>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={submitConfirm}
              disabled={confirmBusy || confirmLines.length === 0}
              startIcon={
                confirmBusy ? <CircularProgress size={16} /> : <DoneAllIcon />
              }
              sx={{ fontWeight: 800 }}
            >
              确认收货
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* 全局提示 */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.sev}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}

/* ================= 子组件 ================= */

function Panel({
  title,
  count,
  headerBg,
  headerBorder,
  bodyBorder,
  titleColor,
  emptyText,
  children
}: {
  title: string
  count: number
  headerBg: string
  headerBorder: string
  bodyBorder: string
  titleColor?: string
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${bodyBorder}`,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#fff',
        minHeight: 0
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 0.8,
          borderBottom: `1px solid ${headerBorder}`,
          background: headerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <Typography
          sx={{ fontWeight: 900, fontSize: 14, color: titleColor || '#0f172a' }}
        >
          {title}
        </Typography>
        <Chip
          size='small'
          label={count}
          sx={{ fontSize: 12, height: 20, fontWeight: 700 }}
          variant='outlined'
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          minHeight: 0,
          position: 'relative'
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}

function RowCard({
  code,
  qty,
  hint,
  ok
}: {
  code: string
  qty: number
  hint: string
  ok?: boolean
}) {
  return (
    <Box
      sx={{
        border: `1px dashed ${ok ? '#86efac' : '#c7d2fe'}`,
        bgcolor: '#fff',
        borderRadius: 2,
        px: 0.9,
        py: 0.55,
        mb: 0.6,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 0.5
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1.15,
            fontFamily: 'ui-monospace,Menlo,Consolas,"Courier New",monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={code}
        >
          {code}
          <Chip
            size='small'
            label={`× ${qty}`}
            sx={{
              ml: 0.75,
              height: 18,
              fontSize: 11,
              fontWeight: 800,
              borderRadius: 1,
              '& .MuiChip-label': { px: 0.6, lineHeight: '18px' }
            }}
            variant='outlined'
          />
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ fontSize: 10.5 }}
        >
          {hint}
        </Typography>
      </Box>
      <TickSquare checked={!!ok} />
    </Box>
  )
}

function Empty({ text, sub }: { text: string; sub?: string }) {
  return (
    <Box
      sx={{
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'text.secondary'
      }}
    >
      <Typography variant='body2'>{text}</Typography>
      {sub && <Typography variant='caption'>{sub}</Typography>}
    </Box>
  )
}

function BusyOverlay() {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: 'rgba(241,245,249,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
      }}
    >
      <CircularProgress size={22} />
    </Box>
  )
}

function TickSquare({ checked }: { checked: boolean }) {
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: 2,
        border: '2px solid',
        borderColor: checked ? '#166534' : '#cbd5e1',
        background: checked ? '#f0fdf4' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}
      aria-label={checked ? 'matched' : 'unmatched'}
    >
      {checked && (
        <CheckIcon sx={{ fontSize: 12, color: '#166534', lineHeight: 1 }} />
      )}
    </Box>
  )
}

/** 紧凑单行：货号 ｜ 应收（只读）｜ 确认数量（可改）｜ 匹配状态 */
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
        borderRadius: 2,
        px: 0.75,
        py: 0.5,
        mb: 0.6,
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
        {/* 货号 */}
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

        {/* 应收（只读） */}
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

        {/* 确认数量（可编辑） */}
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
