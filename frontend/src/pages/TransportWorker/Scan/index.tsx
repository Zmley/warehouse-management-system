// src/pages/Scan/index.tsx
import { useMemo, useState } from 'react'
import { Box, Paper, IconButton, Typography, Button } from '@mui/material'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import KeyboardAltIcon from '@mui/icons-material/KeyboardAlt'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import ScanGun from './HandheldScanerPanel'
import ManualInputPanel from './ManualInputPanel'
import CameraPanel from './CameraPanel'

type Mode = 'gun' | 'camera' | 'manual'

type ModeItem = {
  key: Mode
  label: string
  Icon: typeof QrCodeScannerIcon
}

export default function Scan() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // 读取并记忆默认模式
  const [mode, setMode] = useState<Mode>(() => {
    const saved = (localStorage.getItem('scanMode') || 'gun') as Mode
    return ['gun', 'camera', 'manual'].includes(saved) ? saved : 'gun'
  })

  const setAndSave = (m: Mode) => {
    setMode(m)
    localStorage.setItem('scanMode', m)
  }

  // 用 t() 动态构造分段选项（支持语言切换即时更新）
  const MODES: ModeItem[] = useMemo(
    () => [
      { key: 'gun', label: t('scan.modes.gun'), Icon: QrCodeScannerIcon },
      { key: 'camera', label: t('scan.modes.camera'), Icon: PhoneIphoneIcon },
      { key: 'manual', label: t('scan.modes.manual'), Icon: KeyboardAltIcon }
    ],
    [t]
  )

  const activeIndex = MODES.findIndex(m => m.key === mode)

  const Panel = useMemo(() => {
    if (mode === 'camera') return <CameraPanel />
    if (mode === 'manual') return <ManualInputPanel />
    return <ScanGun />
  }, [mode])

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
        {/* 顶部分段控件 */}
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
            onChange={i => setAndSave(MODES[i].key)}
          />
        </Paper>

        {/* 当前面板 + 取消按钮 */}
        <Box>
          {Panel}

          {/* 取消按钮：模块下方 10px */}
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
      {/* 滑块高亮 */}
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
              onClick={() => onChange(i)}
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
