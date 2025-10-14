// pages/MobileReceive.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Chip
} from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckIcon from '@mui/icons-material/Check'
import { TransferStatusUI } from 'constants/index'
import { useTransfer } from 'hooks/useTransfer'
import { useParams } from 'react-router-dom'
import { useAuth } from 'hooks/useAuth'
import { useProduct } from 'hooks/useProduct'
import MobileScanConfirm, { PendingLite } from './MobileScanConfirm'

type TransferRow = {
  transferID: string
  productCode: string
  quantity: number
  status: TransferStatusUI
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

  // 两个实例分别取 PENDING / IN_PROCESS
  const {
    getTransfers: getPending,
    isLoading: loadingP,
    transfers: transfersP,
    handleConfirmReceive
  } = useTransfer()
  const {
    getTransfers: getInProcess,
    isLoading: loadingI,
    transfers: transfersI
  } = useTransfer()

  const [updating, setUpdating] = useState(false)
  const [snack, setSnack] = useState<{
    open: boolean
    msg: string
    sev: 'success' | 'error' | 'info'
  }>({
    open: false,
    msg: '',
    sev: 'info'
  })
  const [scanConfirmOpen, setScanConfirmOpen] = useState(false)

  const [pending, setPending] = useState<TransferRow[]>([])
  const [inProcess, setInProcess] = useState<TransferRow[]>([])

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

  // 确认成功后，在本地把对应行从 pending 移到 inProcess
  const moveToInProcess = (confirmedIDs: string[]) => {
    const set = new Set(confirmedIDs)
    const moved: TransferRow[] = []
    const remain: TransferRow[] = []
    for (const r of pending) {
      if (set.has(r.transferID)) moved.push({ ...r, status: 'IN_PROCESS' })
      else remain.push(r)
    }
    setPending(remain)
    setInProcess(prev => [...moved, ...prev])
    setSnack({
      open: true,
      msg: '已确认收货，项目进入 In Process。',
      sev: 'success'
    })
  }

  const counts = useMemo(
    () => ({ p: pending.length, i: inProcess.length }),
    [pending.length, inProcess.length]
  )
  const busy = updating || loadingP || loadingI

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
        {/* 顶部操作条 */}
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
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
            托盘收货
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Button
              size='small'
              variant='outlined'
              startIcon={<QrCodeScannerIcon />}
              onClick={() => setScanConfirmOpen(true)}
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
                  ok
                />
              ))
            )}
          </Panel>
        </Box>
      </Box>

      {/* 扫描 + 确认（独立文件） */}
      <MobileScanConfirm
        open={scanConfirmOpen}
        onClose={() => setScanConfirmOpen(false)}
        pending={pending as PendingLite[]}
        fetchProduct={fetchProduct}
        confirmReceive={handleConfirmReceive}
        onConfirmedSuccess={moveToInProcess}
        onError={msg => setSnack({ open: true, msg, sev: 'error' })}
      />

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

/* ===== 子组件（保持轻量） ===== */

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
  ok
}: {
  code: string
  qty: number
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
      </Box>
      <TickSquare checked={!!ok} />
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
