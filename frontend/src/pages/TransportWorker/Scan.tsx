import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  Drawer,
  Autocomplete,
  TextField,
  Paper
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'
import { useTaskContext } from 'contexts/task'
import LoadConfirm from './components/LoadConfirm'
import UnloadConfirm from './components/UnloadConfirm' // ✅ 引入卸货确认组件
import MultiProductInputBox from './components/ManualInputBox'
import { ScanMode } from 'constants/index'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

const Scan = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)

  const { loadCart } = useCart() // ❗️卸货改由 UnloadConfirm 内部调用 unloadCart
  const { fetchBinCodes, binCodes } = useBin()
  const { fetchInventoriesByBinCode } = useInventory()
  const { fetchProduct, loadProducts, productCodes } = useProduct()
  const { myTask } = useTaskContext()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD

  // 父层传来的卸货清单（必须包含 inventoryID / productCode / quantity）
  const unloadProductList =
    (location.state?.unloadProductList as
      | { inventoryID: string; productCode: string; quantity: number }[]
      | undefined) ?? []

  const [manualInput, setManualInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [defaultManualItems, setDefaultManualItems] = useState<
    { productCode: string; quantity: string }[]
  >([])

  // 卸货用：把要卸的购物车条目传到 UnloadConfirm
  const [unloadCartItems, setUnloadCartItems] = useState<
    { inventoryID: string; productCode: string; quantity: number }[]
  >([])

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [])

  const stopScanner = () => {
    scannerRef.current?.router?.stopCapturing()
    scannerRef.current?.cameraEnhancer?.close()
  }

  const parseProductList = (text: string) => {
    return text
      .split(',')
      .map(pair => {
        const [code, qty] = pair.split(':').map(s => s.trim())
        if (code && qty && /^\d+$/.test(qty)) {
          return { productCode: code, quantity: qty }
        }
        return null
      })
      .filter(Boolean) as { productCode: string; quantity: string }[]
  }

  const handleScanOrManualSubmit = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) {
      setError(t('scan.enterPrompt'))
      return
    }

    // 任务模式限制
    if (myTask) {
      const isSingleBarcode = /^\d{8,}$/.test(trimmed)
      const isMultiProduct = trimmed.includes(':') || trimmed.includes(',')
      if (isSingleBarcode || isMultiProduct) {
        stopScanner()
        setError(t('scan.taskActiveOnlyBinCode'))
        return
      }
    }

    try {
      // ✅ UNLOAD：扫描/输入的是 BinCode，打开 UnloadConfirm
      if (scanMode === ScanMode.UNLOAD) {
        // 这里不直接调用 unloadCart，而是进入确认页
        stopScanner()
        setScannedBinCode(trimmed)
        setUnloadCartItems(unloadProductList) // 父层应保证带 inventoryID
        setShowDrawer(true)
        return
      }

      // 下面是 LOAD 逻辑不变
      if (trimmed.includes(':') || trimmed.includes(',')) {
        const parsed = parseProductList(trimmed)
        if (parsed.length > 0) {
          stopScanner()
          setDefaultManualItems(parsed)
          setShowDrawer(true)
          return
        }
      }

      if (/^\d{8,}$/.test(trimmed)) {
        const product = await fetchProduct(trimmed)
        if (product) {
          stopScanner()
          setDefaultManualItems([
            { productCode: product.productCode, quantity: '1' }
          ])
          setShowDrawer(true)
          return
        }
      }

      const result = await fetchInventoriesByBinCode(trimmed)
      if (result?.inventories?.length) {
        stopScanner()
        setScannedBinCode(trimmed)
        setInventoryList(result.inventories)
        setShowDrawer(true)
      } else {
        throw new Error(t('scan.noInventoryFound'))
      }
    } catch (err) {
      console.error(err)
      setError(t('scan.operationError'))
    }
  }

  useEffect(() => {
    const initScanner = async () => {
      try {
        const { Dynamsoft } = window
        await Dynamsoft.License.LicenseManager.initLicense(license)
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        const cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)

        document
          .getElementById('scanner-view')
          ?.append(cameraView.getUIElement())

        const router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
        await router.setInput(cameraEnhancer)

        const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
        receiver.onCapturedResultReceived = async (result: any) => {
          if (scannedRef.current) return
          for (const item of result.items) {
            const text = item.text?.trim()
            if (text) {
              scannedRef.current = true
              stopScanner()
              await handleScanOrManualSubmit(text)
              break
            }
          }
        }

        router.addResultReceiver(receiver)
        await cameraEnhancer.open()
        await router.startCapturing('ReadBarcodes_SpeedFirst')

        scannerRef.current = { router, cameraEnhancer }
      } catch (err) {
        console.error('Scanner error:', err)
        setError(t('scan.operationError'))
      }
    }

    initScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const handleCancel = () => {
    stopScanner()
    navigate('/')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 4
      }}
    >
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600 }}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          {t('scan.scanBinCode')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
          <Autocomplete
            options={binCodes}
            value={manualInput}
            onInputChange={(e, val) => setManualInput(val)}
            onChange={(e, newVal) => setManualInput(newVal || '')}
            filterOptions={(options, state) =>
              state.inputValue.length === 0
                ? []
                : options.filter(option =>
                    option
                      .toLowerCase()
                      .includes(state.inputValue.toLowerCase())
                  )
            }
            openOnFocus={false}
            sx={{ flex: 1 }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('scan.inputBinCode')}
                variant='outlined'
                size='small'
              />
            )}
          />
          <Button
            onClick={() => {
              stopScanner()
              handleScanOrManualSubmit(manualInput)
            }}
            variant='contained'
            sx={{
              height: '40px',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #1976d2, #42a5f5)'
            }}
          >
            {t('scan.confirm')}
          </Button>
        </Box>

        <Box
          id='scanner-view'
          sx={{
            height: 300,
            mt: 2,
            borderRadius: 3,
            overflow: 'hidden',
            border: '2px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        />

        {/* 手动输入按钮：UNLOAD 模式下禁用（跟原来一致） */}
        <Button
          fullWidth
          disabled={!!myTask || scanMode === ScanMode.UNLOAD}
          onClick={() => {
            stopScanner()
            setScannedBinCode(null)
            setInventoryList([])
            setDefaultManualItems([])
            setShowDrawer(true)
          }}
          sx={{
            mt: 2,
            background:
              !!myTask || scanMode === ScanMode.UNLOAD
                ? 'linear-gradient(to right, #d3d3d3, #e0e0e0)'
                : 'linear-gradient(to right, #1976d2, #42a5f5)',
            color:
              !!myTask || scanMode === ScanMode.UNLOAD ? '#7a7a7a' : 'white',
            py: 1.5,
            borderRadius: 3,
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow:
              !!myTask || scanMode === ScanMode.UNLOAD
                ? 'none'
                : '0 4px 12px rgba(66, 165, 245, 0.4)',
            cursor:
              !!myTask || scanMode === ScanMode.UNLOAD
                ? 'not-allowed'
                : 'pointer'
          }}
        >
          {t('scan.manualInputButton')}
        </Button>

        <Button
          fullWidth
          onClick={handleCancel}
          sx={{
            mt: 2,
            backgroundColor: '#e53935',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#c62828'
            }
          }}
        >
          {t('scan.cancel')}
        </Button>

        {error && (
          <Typography color='error' mt={2} fontWeight='bold' textAlign='center'>
            {error}
          </Typography>
        )}
      </Paper>
      <Drawer
        anchor='top'
        open={showDrawer}
        onClose={handleCancel}
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '0 0 16px 16px',
            p: 0,
            overflowX: 'hidden',
            bgcolor: '#fff',
            width: '100vw',
            boxSizing: 'border-box'
          }
        }}
      >
        {scanMode === ScanMode.UNLOAD ? (
          scannedBinCode ? (
            <Box sx={{ p: 16 / 8 /* 2 */ }}>
              <UnloadConfirm
                frameless // 👈 关键：无外壳模式
                binCode={scannedBinCode}
                cartItems={unloadCartItems}
                onSuccess={() => {
                  setShowDrawer(false)
                  setScannedBinCode(null)
                  setUnloadCartItems([])
                  navigate('/success')
                }}
                onError={msg => setError(msg || t('scan.operationError'))}
              />
            </Box>
          ) : null
        ) : scannedBinCode && inventoryList.length > 0 ? (
          <Box sx={{ p: 2 }}>
            <LoadConfirm
              binCode={scannedBinCode}
              inventories={inventoryList}
              onSuccess={() => {
                setShowDrawer(false)
                setScannedBinCode(null)
                setInventoryList([])
                navigate('/success')
              }}
            />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <MultiProductInputBox
              productOptions={productCodes}
              onSubmit={async items => {
                const result = await loadCart({ productList: items })
                if (!result.success) {
                  setError(result.error || t('scan.operationError'))
                  return
                }
                navigate('/success')
              }}
              onCancel={handleCancel}
              defaultItems={defaultManualItems}
            />
          </Box>
        )}
      </Drawer>
    </Box>
  )
}

export default Scan
