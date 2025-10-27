import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  ButtonBase
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useTransfer } from 'hooks/useTransfer'
import { useParams } from 'react-router-dom'
import { useAuth } from 'hooks/useAuth'
import { useTranslation } from 'react-i18next'
import {
  ConfirmItem,
  DrawerLine,
  DrawerMode,
  PalletGroup,
  PendingLite,
  TransferRow,
  UndoItem
} from 'types/inventory'
import ConfirmReceiveDrawer from './ConfirmReceiveDrawer'

export default function MobileReceive({
  warehouseID: propWarehouseID
}: {
  warehouseID?: string
}) {
  const { t } = useTranslation()
  const params = useParams<{ warehouseID?: string }>()
  const { userProfile } = useAuth()
  const resolvedWarehouseID =
    propWarehouseID || params.warehouseID || userProfile?.warehouseID || ''

  const {
    getTransfers: getPending,
    isLoading: loadingP,
    transfers: transfersP,
    handleConfirmReceive
  } = useTransfer()
  const {
    getTransfers: getInProcess,
    isLoading: loadingI,
    transfers: transfersI,
    handleUndoConfirmReceive
  } = useTransfer()

  const [updating, setUpdating] = useState(false)
  const [snack, setSnack] = useState<{
    open: boolean
    msg: string
    sev: 'success' | 'error' | 'info'
  }>({ open: false, msg: '', sev: 'info' })

  const [pending, setPending] = useState<TransferRow[]>([])
  const [inProcess, setInProcess] = useState<TransferRow[]>([])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('CONFIRM')
  const [drawerLines, setDrawerLines] = useState<DrawerLine[]>([])
  const [confirmItems, setConfirmItems] = useState<ConfirmItem[]>([])
  const [undoItems, setUndoItems] = useState<UndoItem[]>([])

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
        status: 'PENDING',
        taskID: t?.task?.taskID ?? t?.taskID ?? null,
        sourceBinID: t?.sourceBin?.binID ?? t?.sourceBinID ?? null,
        sourceBinCode: t?.sourceBin?.binCode ?? t?.sourceBinCode ?? null,
        sourceWarehouseCode:
          t?.sourceWarehouse?.warehouseCode ?? t?.sourceWarehouseCode ?? null,
        batchID: t?.batchID ?? null
      }))
    )
  }, [transfersP])

  useEffect(() => {
    setInProcess(
      ((transfersI as any[]) || []).map(t => ({
        transferID: t.transferID,
        productCode: t.productCode,
        quantity: Number(t.quantity || 0),
        status: 'IN_PROCESS',
        taskID: t?.task?.taskID ?? t?.taskID ?? null,
        sourceBinID: t?.sourceBin?.binID ?? t?.sourceBinID ?? null,
        sourceBinCode: t?.sourceBin?.binCode ?? t?.sourceBinCode ?? null,
        sourceWarehouseCode:
          t?.sourceWarehouse?.warehouseCode ?? t?.sourceWarehouseCode ?? null,
        batchID: t?.batchID ?? null
      }))
    )
  }, [transfersI])

  useEffect(() => {
    if (resolvedWarehouseID) load()
  }, [resolvedWarehouseID, load])

  const onRefresh = () => resolvedWarehouseID && load()

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
      msg: t('mobileReceive.snackConfirmed'),
      sev: 'success'
    })
  }

  const moveToPending = (undoIDs: string[]) => {
    const set = new Set(undoIDs)
    const moved: TransferRow[] = []
    const remain: TransferRow[] = []
    for (const r of inProcess) {
      if (set.has(r.transferID)) moved.push({ ...r, status: 'PENDING' })
      else remain.push(r)
    }
    setInProcess(remain)
    setPending(prev => [...moved, ...prev])
    setSnack({
      open: true,
      msg: t('mobileReceive.snackUndone'),
      sev: 'success'
    })
  }

  const counts = useMemo(
    () => ({ p: pending.length, i: inProcess.length }),
    [pending.length, inProcess.length]
  )
  const busy = updating || loadingP || loadingI

  // Group rows by pallet rules
  const groupByPallet = (rows: TransferRow[]): PalletGroup[] => {
    const bucket: Record<string, PalletGroup> = {}

    for (const r of rows) {
      const sourceBinID = r.sourceBinID || null
      const batchID = r.batchID || null

      let key: string
      if (batchID && sourceBinID) {
        key = `B:${batchID}|S:${sourceBinID}`
      } else if (sourceBinID) {
        key = `LEGACY:S:${sourceBinID}|X:${r.taskID || r.transferID}`
      } else {
        key = `SINGLE:${r.transferID}`
      }

      if (!bucket[key]) {
        bucket[key] = {
          binCode: r.sourceBinCode ?? null,
          warehouseCode: r.sourceWarehouseCode ?? null,
          rows: []
        }
      }
      bucket[key].rows.push(r)
    }

    const groups = Object.values(bucket)

    groups.sort((a, b) => {
      const A = a.binCode || ''
      const B = b.binCode || ''
      return A.localeCompare(B)
    })

    return groups
  }

  const splitByWarehouse = (groups: PalletGroup[]) => {
    const m = new Map<string, PalletGroup[]>()
    for (const g of groups) {
      const w = g.warehouseCode || t('mobileReceive.unknownWarehouse')
      if (!m.has(w)) m.set(w, [])
      m.get(w)!.push(g)
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }

  const pendingGroups = useMemo(() => groupByPallet(pending), [pending])
  const inProcessGroups = useMemo(() => groupByPallet(inProcess), [inProcess])

  const openConfirmForGroup = (items: PendingLite[]) => {
    setDrawerMode('CONFIRM')
    setDrawerLines(
      items.map(it => ({ productCode: it.productCode, qty: it.quantity }))
    )
    setConfirmItems(
      items.map(it => ({
        transferID: it.transferID,
        productCode: it.productCode,
        quantity: it.quantity
      }))
    )
    setUndoItems([])
    setDrawerOpen(true)
  }

  const openUndoForGroup = (rows: TransferRow[]) => {
    setDrawerMode('UNDO')
    setDrawerLines(
      rows.map(r => ({ productCode: r.productCode, qty: r.quantity }))
    )
    setUndoItems(
      rows.map(r => ({ transferID: r.transferID, productCode: r.productCode }))
    )
    setConfirmItems([])
    setDrawerOpen(true)
  }

  const handleSubmitDrawer = async () => {
    if (drawerMode === 'CONFIRM') {
      if (confirmItems.length === 0) {
        setDrawerOpen(false)
        return
      }
      const res = await handleConfirmReceive(confirmItems)
      if (!res?.success) {
        setSnack({
          open: true,
          msg: res?.message || t('mobileReceive.confirmFail'),
          sev: 'error'
        })
        return
      }
      moveToInProcess(confirmItems.map(i => i.transferID))
    } else {
      if (undoItems.length === 0) {
        setDrawerOpen(false)
        return
      }
      const res = await handleUndoConfirmReceive(undoItems as any)
      if (!res?.success) {
        setSnack({
          open: true,
          msg: res?.message || t('mobileReceive.undoFail'),
          sev: 'error'
        })
        return
      }
      moveToPending(undoItems.map(i => i.transferID))
    }
    setDrawerOpen(false)
  }

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: '#f6f7fb',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        px: 1,
        py: 1
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
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
            {t('mobileReceive.title')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <IconButton
              size='small'
              onClick={onRefresh}
              disabled={!resolvedWarehouseID}
              aria-label={t('mobileReceive.refresh')}
            >
              {busy ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshIcon fontSize='small' />
              )}
            </IconButton>
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          {/* Pending */}
          <Panel
            title={t('mobileReceive.pendingTitle')}
            count={counts.p}
            headerBg='#f1f5f9'
            headerBorder='#e5e7eb'
            bodyBorder='#e5e7eb'
            emptyText={t('mobileReceive.emptyPending')}
          >
            {busy ? (
              <BusyOverlay />
            ) : pendingGroups.length === 0 ? (
              <Empty text={t('mobileReceive.emptyPending')} />
            ) : (
              splitByWarehouse(pendingGroups).map(([wh, groups]) => (
                <Box key={`wh-p-${wh}`} sx={{ mt: 0.5 }}>
                  <Box
                    sx={{
                      my: 0.6,
                      position: 'relative',
                      textAlign: 'center',
                      borderTop: '1px dashed #93c5fd',
                      lineHeight: 0
                    }}
                  >
                    <Typography
                      component='span'
                      sx={{
                        position: 'relative',
                        top: '-0.65em',
                        background: '#fff',
                        px: 0.8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#1e3a8a'
                      }}
                    >
                      {wh}
                    </Typography>
                  </Box>

                  {groups.map((group, gi) => {
                    const items: PendingLite[] = group.rows.map(r => ({
                      transferID: r.transferID,
                      productCode: r.productCode,
                      quantity: r.quantity
                    }))
                    return (
                      <PalletButton
                        key={`pg-${wh}-${gi}`}
                        binCode={group.binCode}
                        onClick={() => openConfirmForGroup(items)}
                        variant='pending'
                      >
                        {group.rows.map(row => (
                          <RowItem
                            key={row.transferID}
                            code={row.productCode}
                            qty={row.quantity}
                          />
                        ))}
                      </PalletButton>
                    )
                  })}
                </Box>
              ))
            )}
          </Panel>

          {/* In Process */}
          <Panel
            title={t('mobileReceive.inProcessTitle')}
            count={counts.i}
            headerBg='#dcfce7'
            headerBorder='#bbf7d0'
            bodyBorder='#bbf7d0'
            titleColor='#14532d'
            emptyText={t('mobileReceive.emptyInProcess')}
          >
            {inProcessGroups.length === 0 ? (
              <Empty text={t('mobileReceive.emptyInProcess')} />
            ) : (
              splitByWarehouse(inProcessGroups).map(([wh, groups]) => (
                <Box key={`wh-i-${wh}`} sx={{ mt: 0.5 }}>
                  <Box
                    sx={{
                      my: 0.6,
                      position: 'relative',
                      textAlign: 'center',
                      borderTop: '1px dashed #86efac',
                      lineHeight: 0
                    }}
                  >
                    <Typography
                      component='span'
                      sx={{
                        position: 'relative',
                        top: '-0.65em',
                        background: '#fff',
                        px: 0.8,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#065f46'
                      }}
                    >
                      {wh}
                    </Typography>
                  </Box>

                  {groups.map((group, gi) => (
                    <PalletButton
                      key={`ig-${wh}-${gi}`}
                      binCode={group.binCode}
                      onClick={() => openUndoForGroup(group.rows)}
                      variant='inprocess'
                    >
                      {group.rows.map(row => (
                        <RowItem
                          key={row.transferID}
                          code={row.productCode}
                          qty={row.quantity}
                        />
                      ))}
                    </PalletButton>
                  ))}
                </Box>
              ))
            )}
          </Panel>
        </Box>
      </Box>

      <ConfirmReceiveDrawer
        open={drawerOpen}
        mode={drawerMode}
        lines={drawerLines}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmitDrawer}
      />

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

/** UI helpers */
function PalletButton({
  children,
  binCode,
  onClick,
  variant = 'pending'
}: {
  children: React.ReactNode
  binCode?: string | null
  onClick: () => void
  variant?: 'pending' | 'inprocess'
}) {
  const isGreen = variant === 'inprocess'
  const borderColor = isGreen ? '#16a34a' : '#2563eb'
  const bgColor = isGreen ? '#ecfdf5' : '#eff6ff'
  const insetShadow = isGreen
    ? 'inset 0 0 0 1px rgba(22,163,74,0.15)'
    : 'inset 0 0 0 1px rgba(37,99,235,0.15)'

  return (
    <Box sx={{ position: 'relative', mt: 1 }}>
      {binCode ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#fff',
            px: 1,
            height: 20,
            lineHeight: '20px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            color: '#334155',
            border: '1px solid #cbd5e1',
            zIndex: 1,
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {binCode}
        </Box>
      ) : null}

      <ButtonBase
        onClick={onClick}
        sx={{
          width: '100%',
          textAlign: 'left',
          border: `1px dashed ${borderColor}`,
          bgcolor: bgColor,
          borderRadius: 2,
          p: 0.75,
          mb: 0.75,
          boxShadow: insetShadow,
          transition: 'transform .06s ease',
          '&:active': { transform: 'scale(0.998)' }
        }}
      >
        <Box sx={{ width: '100%' }}>{children}</Box>
      </ButtonBase>
    </Box>
  )
}

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
        bgcolor: '#fff'
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 0.6,
          borderBottom: `1px solid ${headerBorder}`,
          background: headerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
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
      <Box sx={{ p: 1 }}>{children}</Box>
    </Paper>
  )
}

function RowItem({ code, qty }: { code: string; qty: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        columnGap: 0.5,
        py: 0.25
      }}
    >
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
      </Typography>
      <Chip
        size='small'
        label={`× ${qty}`}
        sx={{
          height: 18,
          fontSize: 11,
          fontWeight: 800,
          borderRadius: 1,
          '& .MuiChip-label': { px: 0.6, lineHeight: '18px' }
        }}
        variant='outlined'
      />
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
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}
    >
      <CircularProgress size={22} />
    </Box>
  )
}
