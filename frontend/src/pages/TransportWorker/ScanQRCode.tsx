// ScanQRCode.tsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Fade,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Autocomplete,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate, useLocation } from 'react-router-dom'
import useQRScanner from 'hooks/useScanner'
import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useTranslation } from 'react-i18next'
import { isAndroid } from 'utils/platform'
import { ScanMode } from 'constants/index'

interface Props {
  onRequestClose?: () => void
}

const ScanQRCode: React.FC<Props> = ({ onRequestClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loadCart, unloadCart, error } = useCart()
  const { binCodes, fetchBinCodes } = useBin()

  const location = useLocation()
  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList ?? []

  const [manualBinCode, setManualBinCode] = useState('')
  const [mode, setMode] = useState<'manual' | 'scanner'>(
    isAndroid() ? 'manual' : 'scanner'
  )
  const [showCamera, setShowCamera] = useState(true)
  const [isStoppingCamera, setIsStoppingCamera] = useState(false)

  const handleScanSuccess = async (binCode: string) => {
    try {
      if (scanMode === ScanMode.UNLOAD) {
        await unloadCart(binCode, unloadProductList)
        window.location.reload()
      } else {
        await loadCart({ binCode })
        window.location.reload()
      }
    } catch (err) {
      alert(t('scan.operationError'))
    }
  }

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  const handleManualSubmit = async () => {
    if (!manualBinCode.trim()) return alert(t('scan.enterPrompt'))
    await handleScanSuccess(manualBinCode)
  }

  const handleStopCamera = async () => {
    setShowCamera(false)
    setIsStoppingCamera(true)

    try {
      await stopScanning()

      const video = videoRef.current
      if (video && video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach(track => {
          try {
            track.stop()
          } catch (e) {
            console.warn('track.stop() failed:', e)
          }
        })

        // ✅ Safari fix
        video.srcObject = null
        video.pause?.()
        video.removeAttribute('src')
        video.load?.()
        videoRef.current?.remove() // ✅ 强制移除 video 元素
      }
    } catch (err) {
      console.warn('stopScanning or camera cleanup failed:', err)
    }

    setTimeout(() => {
      setIsStoppingCamera(false)
      if (onRequestClose) {
        onRequestClose()
      } else {
        navigate('/', { replace: true, state: { view: 'cart' } })
        window.location.reload()
      }
    })
  }

  useEffect(() => {
    fetchBinCodes()
    if (mode === 'scanner') {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
      const stream = videoRef.current?.srcObject
      if (stream && stream instanceof MediaStream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mode])

  const filterBinOptions = (
    options: string[],
    { inputValue }: { inputValue: string }
  ) => {
    if (!inputValue) return []
    return options.filter(option =>
      option.toLowerCase().startsWith(inputValue.toLowerCase())
    )
  }

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
            onChange={(_, newMode) => newMode && setMode(newMode)}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mb: 3
            }}
          >
            <ToggleButton value='manual'>{t('scan.modeManual')}</ToggleButton>
            <ToggleButton value='scanner'>{t('scan.modeScanner')}</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'scanner' && (
            <Box>
              {showCamera ? (
                <Box position='relative' width='100%' height='240px'>
                  <video
                    key={showCamera ? 'camera-on' : 'camera-off'} // 防止复用 DOM 节点
                    ref={videoRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '2px solid #ddd'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '60%',
                      height: '60%',
                      transform: 'translate(-50%, -50%)',
                      border: '2px dashed #1976d2',
                      borderRadius: 2
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
                      backgroundColor: '#FFFFFFD9',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    {t('scan.alignPrompt')}
                  </Typography>
                </Box>
              ) : (
                <Typography align='center' mt={1} color='text.secondary'>
                  📷 {t('scan.cameraOff') || 'Camera off.'}
                </Typography>
              )}

              <Button
                variant='outlined'
                fullWidth
                color='warning'
                disabled={isStoppingCamera}
                onClick={handleStopCamera}
                sx={{ mt: 2, borderRadius: 2, fontWeight: 'bold' }}
              >
                {isStoppingCamera ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {t('scan.stopping') || 'Stopping...'}
                  </>
                ) : (
                  t('scan.cancel') || 'cancel'
                )}
              </Button>
            </Box>
          )}

          {mode === 'manual' && (
            <Box mt={2}>
              <Autocomplete
                freeSolo
                disableClearable
                options={binCodes}
                value={manualBinCode}
                onInputChange={(_, newValue) => setManualBinCode(newValue)}
                filterOptions={filterBinOptions}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('scan.enterBinCode')}
                    onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton onClick={handleManualSubmit}>
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
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

export default ScanQRCode
