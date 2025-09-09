// src/pages/PickerScan/index.tsx  （如果你原文件名就是 Scan.tsx，就替换那份）
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  TextField,
  Typography
} from '@mui/material'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import KeyboardAltIcon from '@mui/icons-material/KeyboardAlt'
import { useTranslation } from 'react-i18next'

import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import CreateManualTask from './CreateManual'

type Mode = 'camera' | 'gun' | 'manual'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

export default function Scan() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // —— 顶部模式，默认读 localStorage（camera / gun / manual）——
  const [mode, setMode] = useState<Mode>(() => {
    const saved = (localStorage.getItem('scanMode') || 'camera') as Mode
    return ['camera', 'gun', 'manual'].includes(saved) ? saved : 'camera'
  })
  const setAndSaveMode = (m: Mode) => {
    setMode(m)
    localStorage.setItem('scanMode', m)
  }

  // —— 共享 hooks / 状态 ——
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const { fetchBinByCode, fetchBinCodes } = useBin()
  const { fetchProduct, loadProducts } = useProduct()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 初始化基础数据
  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [fetchBinCodes, loadProducts])

  // ===== 摄像头模式（仅 camera 时启用）=====
  useEffect(() => {
    if (mode !== 'camera') return

    const init = async () => {
      try {
        const { Dynamsoft } = window
        await Dynamsoft.License.LicenseManager.initLicense(license)
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        const cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)

        const mount = document.querySelector('.barcode-scanner-view')
        mount?.innerHTML && (mount.innerHTML = '')
        mount?.append(cameraView.getUIElement())

        const router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
        await router.setInput(cameraEnhancer)

        const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
        receiver.onCapturedResultReceived = async (result: any) => {
          if (scannedRef.current) return
          for (const item of result.items) {
            const text = item.text?.trim()
            if (text) {
              scannedRef.current = true
              await handleScan(text)
              break
            }
          }
        }

        router.addResultReceiver(receiver)
        await cameraEnhancer.open()
        await router.startCapturing('ReadBarcodes_SpeedFirst')

        scannerRef.current = { router, cameraEnhancer }
      } catch (err) {
        console.error('Scanner init failed:', err)
        setError(t('scan.operationError'))
      }
    }

    init()
    return () => {
      try {
        scannerRef.current?.router?.stopCapturing()
        scannerRef.current?.cameraEnhancer?.close()
      } catch {}
      scannerRef.current = null
      scannedRef.current = false
    }
  }, [mode, t])

  // —— 处理扫码结果（camera / gun 复用）——
  const handleScan = async (barcodeText: string) => {
    const text = barcodeText.trim()
    if (!text) return

    setError(null)

    try {
      // 扫描枪/相机：均不允许多商品串（逗号/冒号），只走“产品码或货位码”
      if (text.includes(':') || text.includes(',')) {
        setError(t('scan.taskActiveOnlyBinCode')) // 复用之前的提示文案
        return
      }

      // 12位数字：按产品条码查产品；否则按 binCode 查货位
      if (/^\d{8,}$/.test(text)) {
        const fetched = await fetchProduct(text)
        if (fetched) {
          setProduct(fetched)
          stopCameraIfAny()
          return
        }
      }

      const bin = await fetchBinByCode(text)
      stopCameraIfAny()
      navigate('/create-task', { state: { bin } })
    } catch (err) {
      console.error('handleScan error:', err)
      setError(t('scan.operationError'))
    }
  }

  const stopCameraIfAny = () => {
    try {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    } catch {}
  }

  const handleCancel = () => {
    stopCameraIfAny()
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
        {/* 顶部模式切换（苹果式分段更紧凑，这里用 Toggle 简洁可靠） */}
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
            onChange={(_, m: Mode | null) => m && setAndSaveMode(m)}
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
            <ToggleButton value='camera'>
              <SmartphoneIcon sx={{ fontSize: 18 }} />
              {t('scan.modes.camera')}
            </ToggleButton>
            <ToggleButton value='gun'>
              <QrCodeScannerIcon sx={{ fontSize: 18 }} />
              {t('scan.modes.gun')}
            </ToggleButton>
            <ToggleButton value='manual'>
              <KeyboardAltIcon sx={{ fontSize: 18 }} />
              {t('scan.modes.manual')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Box>
          {mode === 'camera' && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e6ebf2',
                bgcolor: 'rgba(255,255,255,0.9)'
              }}
            >
              <Box
                className='barcode-scanner-view'
                sx={{
                  height: { xs: 220, sm: 280 },
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '2px solid #ccc',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              />
              {error && (
                <Typography
                  color='error'
                  mt={1.25}
                  fontWeight='bold'
                  textAlign='center'
                >
                  {error}
                </Typography>
              )}
            </Paper>
          )}

          {/* 扫描枪模式（无确认按钮，自动提交；提示放占位符里） */}
          {mode === 'gun' && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e6ebf2',
                bgcolor: 'rgba(255,255,255,0.9)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GunInput onSubmit={handleScan} />
              </Box>
              {error && (
                <Typography
                  color='error'
                  mt={1.25}
                  fontWeight='bold'
                  textAlign='center'
                >
                  {error}
                </Typography>
              )}
            </Paper>
          )}

          {/* 手动输入模式：复用 CreateManualTask */}
          {mode === 'manual' && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e6ebf2',
                bgcolor: 'rgba(255,255,255,0.9)'
              }}
            >
              <CreateManualTask
                onClose={() => {
                  // 关闭后回到上个模式（不改默认），你也可以直接 navigate('/')
                  setAndSaveMode(
                    (localStorage.getItem('scanMode') as Mode) || 'camera'
                  )
                }}
              />
            </Paper>
          )}

          {/* 产品卡（相机/枪扫到产品时显示） */}
          {!!product && mode !== 'manual' && (
            <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto', mt: 1.25 }}>
              <ProductCard product={product} />
            </Box>
          )}

          {/* 取消按钮：模块下 10~12px */}
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

/** 扫描枪输入框（自动提交；无确认按钮；不支持多商品） */
function GunInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  const END_KEYS = useMemo(() => new Set(['Enter', 'Tab']), [])
  const IDLE_SUBMIT_MS = 140

  const idleRef = useRef<number | null>(null)
  const submittingRef = useRef(false)

  const submit = (raw: string) => {
    if (submittingRef.current) return
    const text = raw.replace(/[\r\n\t]+/g, '').trim()
    if (!text) return
    submittingRef.current = true
    onSubmit(text)
    setValue('')
    // 不立即 refocus，等上层处理完
    setTimeout(() => {
      submittingRef.current = false
      inputRef.current?.focus()
    }, 120)
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const v = e.target.value
    setValue(v)
    if (idleRef.current) window.clearTimeout(idleRef.current)
    idleRef.current = window.setTimeout(() => {
      if (v.trim()) submit(v)
      idleRef.current = null
    }, IDLE_SUBMIT_MS)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (END_KEYS.has(e.key)) {
      e.preventDefault()
      if (idleRef.current) {
        window.clearTimeout(idleRef.current)
        idleRef.current = null
      }
      submit(value)
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      if (idleRef.current) window.clearTimeout(idleRef.current)
    }
  }, [])

  return (
    <TextField
      inputRef={inputRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={t('scan.gun.placeholder')}
      variant='outlined'
      size='small'
      sx={{ width: '100%', maxWidth: 420 }}
      autoFocus
      inputProps={{
        autoCapitalize: 'none',
        autoCorrect: 'off',
        spellCheck: 'false',
        style: { textAlign: 'center', fontWeight: 700, letterSpacing: 0.5 }
      }}
    />
  )
}
