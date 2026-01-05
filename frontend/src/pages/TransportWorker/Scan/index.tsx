import { useMemo, useState } from 'react'
import { Box, Paper, IconButton, Typography, Button } from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import KeyboardAltIcon from '@mui/icons-material/KeyboardAlt'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import HandheldScanerPanel from './HandheldScanerPanel'
import ManualInputPanel from './ManualInputPanel'
import CameraPanel from './CameraPanel'
import { Mode } from 'constants/index'
import { getDefaultModeFromDevice } from 'utils/device'

type ModeItem = {
  key: Mode
  label: string
  Icon: typeof QrCodeScannerIcon
}

export default function Scan() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [panelMode, setPanelMode] = useState<Mode>(() =>
    getDefaultModeFromDevice()
  )

  const MODES: ModeItem[] = useMemo(
    () => [
      { key: Mode.GUN, label: t('scan.modes.gun'), Icon: QrCodeScannerIcon },
      {
        key: Mode.CAMERA,
        label: t('scan.modes.camera'),
        Icon: PhoneIphoneIcon
      },
      { key: Mode.MANUAL, label: t('scan.modes.manual'), Icon: KeyboardAltIcon }
    ],
    [t]
  )

  const activeIndex = MODES.findIndex(m => m.key === panelMode)

  const Panel = useMemo(() => {
    if (panelMode === Mode.CAMERA) return <CameraPanel />
    if (panelMode === Mode.MANUAL) return <ManualInputPanel />
    return <HandheldScanerPanel />
  }, [panelMode])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f7f9fc',
        display: 'flex',
        justifyContent: 'center',
        px: 1.5,
        py: 1.5
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 880 }}>
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            p: 0.75,
            borderRadius: 3,
            border: '1px solid #e6ebf2',
            bgcolor: 'rgba(255,255,255,0.9)'
          }}
        >
          <SegmentedControl
            options={MODES}
            activeIndex={activeIndex}
            onChange={i => setPanelMode(MODES[i].key)}
          />
        </Paper>

        <Box>
          {Panel}

          <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={() => navigate('/')}
              variant='outlined'
              color='inherit'
              sx={{ px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function SegmentedControl({
  options,
  activeIndex,
  onChange
}: {
  options: Array<{ key: Mode; label: string; Icon: typeof QrCodeScannerIcon }>
  activeIndex: number
  onChange: (index: number) => void
}) {
  const count = options.length
  const widthPct = 100 / count

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${count}, 1fr)`,
        alignItems: 'stretch',
        borderRadius: 999,
        overflow: 'hidden',
        height: 44,
        bgcolor: '#f2f5fa',
        border: '1px solid #e6ebf2'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${widthPct}%`,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: 'transform 240ms cubic-bezier(.22,.61,.36,1)',
          bgcolor: '#ffffff',
          boxShadow: '0 8px 16px rgba(31,59,99,.12)',
          borderRadius: 999
        }}
      />

      {options.map((opt, i) => {
        const active = i === activeIndex
        const Icon = opt.Icon
        return (
          <Box
            key={opt.key}
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              userSelect: 'none',
              px: 1,
              color: active ? '#1f2a37' : '#5b6b7a',
              transition: 'color 160ms ease'
            }}
            onClick={() => onChange(i)}
          >
            <IconButton
              size='small'
              sx={{ color: 'inherit', '&:hover': { bgcolor: 'transparent' } }}
              onClick={e => {
                e.stopPropagation()
                onChange(i)
              }}
            >
              <Icon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography
              variant='body2'
              fontWeight={800}
              sx={{
                letterSpacing: '.2px',
                lineHeight: 1,
                transform: active ? 'translateY(-.2px)' : 'none',
                transition: 'transform 160ms ease'
              }}
            >
              {opt.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
