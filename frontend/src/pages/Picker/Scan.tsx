import {
  Box,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useQRScanner from 'hooks/useQRScanner'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { useTranslation } from 'react-i18next'

const isAndroid = /Android/i.test(navigator.userAgent)

const Scan = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductType | null>(null)
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner')
  const [manualBinCode, setManualBinCode] = useState('')

  const { fetchBinByCode, fetchBinCodes, binCodes } = useBin()
  const { fetchProduct } = useProduct()

  const handleScan = async (code: string) => {
    if (/^\d{12}$/.test(code)) {
      try {
        const fetchedProduct = await fetchProduct(code)
        if (fetchedProduct) {
          setProduct(fetchedProduct)
        } else {
          alert(t('scan.productNotFound'))
        }
      } catch (err) {
        console.error(err)
        alert(t('scan.fetchError'))
      }
      return
    }

    try {
      const bin = await fetchBinByCode(code)
      navigate('/create-task', { state: { bin } })
    } catch (err: any) {
      console.error(err)
      alert(t('scan.invalidBin'))
    }
  }

  const { videoRef, startScanning, stopScanning, isScanning } =
    useQRScanner(handleScan)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    fetchBinCodes()
    if (!isAndroid && mode === 'scanner' && !isScanning) {
      startScanning()
    }
    const interval = setInterval(() => {
      const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
      if (stream instanceof MediaStream) {
        streamRef.current = stream
        clearInterval(interval)
      }
    }, 300)
    return () => {
      stopScanning()
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [mode])

  const handleCancel = () => {
    stopScanning()
    const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(track => track.stop())
    }
    navigate('/')
  }

  const handleManualSubmit = async () => {
    if (!manualBinCode.trim()) return alert(t('scan.enterPrompt'))
    await handleScan(manualBinCode.trim())
  }

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Typography variant='h5' fontWeight='bold' mb={2}>
        {t('scan.title')}
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, newMode) => {
          if (!newMode) return
          setMode(newMode)
          if (newMode === 'scanner') startScanning()
          else stopScanning()
        }}
        sx={{
          mb: 3,
          borderRadius: '999px',
          backgroundColor: '#e2e8f0',
          boxShadow: 'inset 0 2px 5px #0000000D',
          p: '4px'
        }}
      >
        <ToggleButton
          value='scanner'
          sx={{ px: 3, py: 1, borderRadius: '999px', fontWeight: 'bold' }}
        >
          {t('scan.modeScanner')}
        </ToggleButton>
        <ToggleButton
          value='manual'
          sx={{ px: 3, py: 1, borderRadius: '999px', fontWeight: 'bold' }}
        >
          {t('scan.modeManual')}
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === 'scanner' && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            height: '260px',
            borderRadius: '16px',
            overflow: 'hidden',
            mx: 'auto',
            border: '5px solid #1976d2',
            boxShadow: '0 4px 20px #1976D24D',
            backgroundColor: '#000'
          }}
        >
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay
            playsInline
            muted
          />

          <Box
            sx={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '80%',
              border: '2px dashed #00e676',
              borderRadius: '12px',
              zIndex: 10
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '80%',
              height: '2px',
              background: 'linear-gradient(to right, #00e676, transparent)',
              animation: 'scanLine 2s infinite',
              zIndex: 11
            }}
          />

          <Typography
            variant='body2'
            sx={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#fff',
              backgroundColor: '#00000066',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 'bold',
              fontSize: '0.8rem',
              zIndex: 12
            }}
          >
            {t('scan.alignPrompt')}
          </Typography>

          <style>{`
            @keyframes scanLine {
              0% { top: 10%; }
              50% { top: 80%; }
              100% { top: 10%; }
            }
          `}</style>
        </Box>
      )}

      {mode === 'manual' && (
        <Box mt={2} width='100%' maxWidth={400}>
          <AutocompleteTextField
            label={t('scan.enterBinOrProduct')}
            value={manualBinCode}
            onChange={setManualBinCode}
            onSubmit={handleManualSubmit}
            options={binCodes}
          />
          <Button
            variant='contained'
            sx={{ mt: 2 }}
            fullWidth
            onClick={handleManualSubmit}
          >
            {t('scan.submit')}
          </Button>
        </Box>
      )}

      {product && (
        <Box mt={4} width='100%' display='flex' justifyContent='center'>
          <ProductCard product={product} />
        </Box>
      )}

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ maxWidth: 400, mt: 3 }}
        onClick={handleCancel}
      >
        {t('scan.cancel')}
      </Button>
    </Box>
  )
}

export default Scan
