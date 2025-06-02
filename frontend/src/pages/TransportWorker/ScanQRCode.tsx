import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Fade,
  ToggleButtonGroup,
  ToggleButton,
  Paper
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import { useNavigate, useLocation } from 'react-router-dom'
import useQRScanner from 'hooks/useQRScanner'
import { useCart } from 'hooks/useCart'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { useBin } from 'hooks/useBin'
import { useTranslation } from 'react-i18next'

const isAndroid = /Android/i.test(navigator.userAgent)

const ScanTaskQRCode = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner')
  const { loadCart, unloadCart, error } = useCart()
  const { binCodes, fetchBinCodes } = useBin()

  const location = useLocation()
  const scanMode = location.state?.mode ?? 'load'
  const unloadProductList = location.state?.unloadProductList ?? []

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  async function handleScanSuccess(binCode: string) {
    try {
      if (scanMode === 'unload') {
        await unloadCart(binCode, unloadProductList)
      } else {
        await loadCart({ binCode })
      }
    } catch (err) {
      alert(t('scan.operationError'))
    }
  }

  useEffect(() => {
    fetchBinCodes()
    if (!isAndroid) mode === 'scanner' ? startScanning() : stopScanning()
    return () => {
      stopScanning()
      const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
      if (stream && stream instanceof MediaStream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mode])

  const [manualBinCode, setManualBinCode] = useState('')
  const handleManualSubmit = async () => {
    if (!manualBinCode.trim()) return alert(t('scan.enterPrompt'))
    await handleScanSuccess(manualBinCode)
  }

  const handleCancel = () => navigate(-1)

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={6}
          sx={{
            p: 3,
            borderRadius: 4,
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#fff'
          }}
        >
          <Typography
            variant='h5'
            fontWeight='bold'
            align='center'
            gutterBottom
          >
            {t('scan.scanBin')}
          </Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (!newMode) return
              setMode(newMode)
            }}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mb: 3,
              '& .MuiToggleButton-root': {
                fontWeight: 'bold',
                px: 3
              },
              '& .Mui-selected': {
                backgroundColor: '#1976d2 !important',
                color: '#fff'
              }
            }}
          >
            <ToggleButton value='scanner'>{t('scan.modeScanner')}</ToggleButton>
            <ToggleButton value='manual'>{t('scan.modeManual')}</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'scanner' && (
            <Box position='relative' width='100%' height='240px'>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '2px solid #ddd'
                }}
              />

              {/* 扫描对准框 */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '60%',
                  height: '60%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px dashed #1976d2',
                  borderRadius: 2,
                  boxShadow: '0 0 12px rgba(25, 118, 210, 0.4) inset',
                  pointerEvents: 'none'
                }}
              />

              <Typography
                align='center'
                sx={{
                  position: 'absolute',
                  top: 'calc(50% + 32%)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 14,
                  color: '#1976d2',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                {t('scan.alignPrompt')}
              </Typography>
            </Box>
          )}

          {mode === 'manual' && (
            <Box mt={2}>
              <AutocompleteTextField
                label={t('scan.enterBinCode')}
                value={manualBinCode}
                onChange={setManualBinCode}
                onSubmit={handleManualSubmit}
                options={binCodes}
              />
              <Button
                variant='contained'
                onClick={handleManualSubmit}
                fullWidth
                sx={{ mt: 2 }}
              >
                {t('scan.submit')}
              </Button>
            </Box>
          )}

          <Button
            startIcon={<CancelIcon />}
            variant='outlined'
            color='error'
            fullWidth
            sx={{
              mt: 4,
              borderRadius: 2,
              fontWeight: 'bold',
              fontSize: 15,
              py: 1.2,
              borderWidth: 2,
              '&:hover': {
                backgroundColor: '#ffe5e5',
                borderColor: '#d32f2f'
              }
            }}
            onClick={handleCancel}
          >
            {t('scan.cancel')}
          </Button>

          {error && (
            <Typography color='error' mt={2} align='center'>
              {error}
            </Typography>
          )}
        </Paper>
      </Fade>
    </Box>
  )
}

export default ScanTaskQRCode
