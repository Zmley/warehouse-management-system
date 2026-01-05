import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Button
} from '@mui/material'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import KeyboardAltIcon from '@mui/icons-material/KeyboardAlt'
import { useTranslation } from 'react-i18next'

import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import { Mode } from 'constants/index'
import { getDefaultModeFromDevice } from 'utils/device'

import CameraPanel, { CameraHandle } from './CameraPanel'
import GunPanel from './GunPanel'
import ProductCard from '../ProductCard'
import CreateManual from './CreateManual'

export default function PickerScan() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>(() => getDefaultModeFromDevice())

  const camRef = useRef<CameraHandle>(null)
  const scannedRef = useRef(false)
  const { fetchBinByCode, fetchBinCodes } = useBin()
  const { fetchProduct, loadProducts } = useProduct()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [fetchBinCodes, loadProducts])

  const handleScan = useCallback(
    async (barcodeText: string) => {
      const text = barcodeText.trim()
      if (!text) return
      setError(null)

      try {
        if (text.includes(':') || text.includes(',')) {
          setError(t('scan.taskActiveOnlyBinCode'))
          return
        }

        if (/^\d{8,}$/.test(text)) {
          const fetched = await fetchProduct(text)
          if (fetched) {
            setProduct(fetched)
            return
          }
        }

        const bin = await fetchBinByCode(text)
        navigate('/create-task', { state: { bin } })
      } catch (err) {
        console.error('handleScan error:', err)
        setError(t('scan.operationError'))
      }
    },
    [fetchBinByCode, fetchProduct, navigate, t]
  )

  const changeMode = (next: Mode | null) => {
    if (!next || next === mode) return
    if (mode === Mode.CAMERA && next !== Mode.CAMERA) {
      camRef.current?.stop()
    }
    setMode(next)
  }

  const handleCancel = () => {
    camRef.current?.stop()
    navigate('/')
  }

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
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, m: Mode | null) => changeMode(m)}
            fullWidth
            size='small'
            color='primary'
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontWeight: 700,
                gap: 0.5,
                px: 1.25,
                py: 0.75
              }
            }}
          >
            <ToggleButton value={Mode.CAMERA}>
              <SmartphoneIcon sx={{ fontSize: 18 }} />
              {t('scan.modes.camera')}
            </ToggleButton>
            <ToggleButton value={Mode.GUN}>
              <QrCodeScannerIcon sx={{ fontSize: 18 }} />
              {t('scan.modes.gun')}
            </ToggleButton>
            <ToggleButton value={Mode.MANUAL}>
              <KeyboardAltIcon sx={{ fontSize: 18 }} />
              {t('scan.modes.manual')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Box>
          {mode === Mode.CAMERA && (
            <CameraPanel
              ref={camRef}
              onScan={async code => {
                if (scannedRef.current) return
                scannedRef.current = true
                try {
                  await handleScan(code)
                } finally {
                  setTimeout(() => {
                    scannedRef.current = false
                  }, 150)
                }
              }}
              error={error}
              setError={setError}
            />
          )}

          {mode === Mode.GUN && (
            <GunPanel onScan={handleScan} error={error} setError={setError} />
          )}

          {mode === Mode.MANUAL && (
            <CreateManual onClose={() => setMode(getDefaultModeFromDevice())} />
          )}

          {!!product && mode !== Mode.MANUAL && (
            <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto', mt: 1.25 }}>
              <ProductCard product={product} />
            </Box>
          )}

          <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={handleCancel}
              variant='outlined'
              color='inherit'
              sx={{ px: 3, fontWeight: 700, textTransform: 'none' }}
            >
              {t('scan.cancel', 'Cancel')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
