import React, { useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Chip
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { DrawerLine, DrawerMode } from 'types/inventory'

export default function ConfirmReceiveDrawer({
  open,
  mode,
  lines,
  onClose,
  onSubmit
}: {
  open: boolean
  mode: DrawerMode
  lines: DrawerLine[]
  onClose: () => void
  onSubmit: () => Promise<void> | void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  const handleSubmit = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onSubmit()
    } finally {
      setBusy(false)
    }
  }

  const isUndo = mode === 'UNDO'
  const title = isUndo
    ? t('confirmDrawer.titleUndo')
    : t('confirmDrawer.titleConfirm')
  const btnText = isUndo
    ? t('confirmDrawer.btnUndo')
    : t('confirmDrawer.btnConfirm')
  const btnColor: 'error' | 'primary' = isUndo ? 'error' : 'primary'
  const subText = isUndo
    ? t('confirmDrawer.subUndo', { count: lines.length })
    : t('confirmDrawer.subConfirm', { count: lines.length })

  return (
    <Drawer
      anchor='top'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          p: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(2,6,23,0.12)'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          px: 1,
          py: 0.8,
          borderBottom: '1px solid #e5e7eb',
          bgcolor: '#fff'
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.1 }}>
            {title}
          </Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            {subText}
          </Typography>
        </Box>
      </Box>

      {/* Body */}
      <Box
        sx={{
          px: 1,
          py: 0.8,
          maxHeight: '65vh',
          overflowY: 'auto',
          bgcolor: '#f8fafc'
        }}
      >
        {lines.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant='body2'>{t('confirmDrawer.empty')}</Typography>
          </Box>
        ) : (
          lines.map((l, idx) => (
            <Box
              key={`${l.productCode}-${idx}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                columnGap: 0.5,
                p: 0.75,
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 1.25,
                mb: 0.6
              }}
            >
              <Typography
                title={l.productCode}
                sx={{
                  fontWeight: 900,
                  fontFamily:
                    'ui-monospace,Menlo,Consolas,"Courier New",monospace',
                  fontSize: 14,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {l.productCode}
              </Typography>
              <Chip
                size='small'
                label={`× ${l.qty}`}
                variant='outlined'
                sx={{
                  height: 18,
                  fontSize: 11,
                  fontWeight: 800,
                  borderRadius: 1,
                  '& .MuiChip-label': { px: 0.6, lineHeight: '18px' }
                }}
              />
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 1,
          py: 0.75,
          borderTop: '1px solid #e5e7eb',
          bgcolor: '#fff',
          boxShadow: '0 -6px 16px rgba(2,6,23,0.06)'
        }}
      >
        <Stack direction='row' spacing={0.75}>
          <Button
            variant='outlined'
            fullWidth
            onClick={onClose}
            disabled={busy}
            sx={{ fontWeight: 800 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant='contained'
            color={btnColor}
            fullWidth
            onClick={handleSubmit}
            disabled={busy || lines.length === 0}
            startIcon={busy ? <CircularProgress size={16} /> : null}
            sx={{ fontWeight: 800 }}
          >
            {btnText}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  )
}
