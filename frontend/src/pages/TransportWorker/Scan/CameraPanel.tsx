import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Drawer, Paper, GlobalStyles } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useCart } from 'hooks/useCart'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'
import { useTaskContext } from 'contexts/task'
import LoadConfirm from '../components/LoadConfirm'
import UnloadConfirm from '../components/UnloadConfirm'
import MultiProductInputBox from '../components/ManualInputBox'
import { ScanMode } from 'constants/index'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

export default function CameraPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)

  const { loadCart } = useCart()
  const { fetchInventoriesByBinCode } = useInventory()
  const { fetchProduct, loadProducts, productCodes } = useProduct()
  const { myTask } = useTaskContext()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList =
    (location.state?.unloadProductList as
      | { inventoryID: string; productCode: string; quantity: number }[]
      | undefined) ?? []

  const [error, setError] = useState<string | null>(null)
  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [defaultManualItems, setDefaultManualItems] = useState<
    { productCode: string; quantity: string }[]
  >([])
  const [unloadCartItems, setUnloadCartItems] = useState<
    { inventoryID: string; productCode: string; quantity: number }[]
  >([])
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const getAllowedLoadBins = (): string[] => {
    const bins =
      myTask?.sourceBins?.map((x: any) => x?.bin?.binCode).filter(Boolean) ?? []
    return [...new Set(bins)]
  }
  const getAllowedUnloadBins = (): string[] => {
    const candidates = [
      myTask?.destinationBinCode,
      myTask?.sourceBinCodes
    ].filter(Boolean) as string[]
    return [...new Set(candidates)]
  }
  const isBinAllowedForMode = (
    mode: ScanMode,
    binCode: string
  ): { ok: boolean; allowed: string[] } => {
    if (!myTask) return { ok: true, allowed: [] }
    if (mode === ScanMode.LOAD) {
      const allowed = getAllowedLoadBins()
      return { ok: allowed.includes(binCode), allowed }
    } else {
      const allowed = getAllowedUnloadBins()
      return { ok: allowed.includes(binCode), allowed }
    }
  }

  const stopScanner = () => {
    try {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    } catch {}
  }

  const handleScan = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return

    try {
      if (myTask) {
        const isSingleBarcode = /^\d{8,}$/.test(trimmed)
        const isMultiProduct = trimmed.includes(':') || trimmed.includes(',')
        if (isSingleBarcode || isMultiProduct) {
          setError(t('scan.taskActiveOnlyBinCode'))
          stopScanner()
          return
        }
      }

      if (scanMode === ScanMode.UNLOAD) {
        const { ok, allowed } = isBinAllowedForMode(ScanMode.UNLOAD, trimmed)
        if (!ok) {
          setError(
            t('scan.onlyUnloadToAssigned', {
              allowed: allowed.join(', '),
              received: trimmed
            })
          )
          stopScanner()
          return
        }
        setScannedBinCode(trimmed)
        setUnloadCartItems(unloadProductList)
        setShowDrawer(true)
        stopScanner()
        return
      }

      if (!myTask && (trimmed.includes(':') || trimmed.includes(','))) {
        const pairs = trimmed
          .split(',')
          .map(pair => {
            const [c, q] = pair.split(':').map(s => s.trim())
            return c && q && /^\d+$/.test(q)
              ? { productCode: c, quantity: q }
              : null
          })
          .filter(Boolean) as { productCode: string; quantity: string }[]
        if (pairs.length > 0) {
          setDefaultManualItems(pairs)
          setShowDrawer(true)
          stopScanner()
          return
        }
      }

      if (!myTask && /^\d{8,}$/.test(trimmed)) {
        const product = await fetchProduct(trimmed)
        if (product) {
          setDefaultManualItems([
            { productCode: product.productCode, quantity: '' }
          ])
          setShowDrawer(true)
          stopScanner()
          return
        }
      }

      const { ok, allowed } = isBinAllowedForMode(ScanMode.LOAD, trimmed)
      if (!ok) {
        setError(
          t('scan.onlyLoadFromAssigned', {
            allowed: allowed.join(', '),
            received: trimmed
          })
        )
        stopScanner()
        return
      }

      const result = await fetchInventoriesByBinCode(trimmed)
      if (result?.inventories?.length) {
        setScannedBinCode(trimmed)
        setInventoryList(result.inventories)
        setShowDrawer(true)
        stopScanner()
      } else {
        setError(t('scan.noInventoryFound'))
      }
    } catch (e) {
      console.error(e)
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

        const host = document.getElementById('scanner-view')
        const ui = cameraView.getUIElement()
        if (host) {
          host.innerHTML = ''
          host.append(ui)
          Object.assign(ui.style, {
            width: '100%',
            height: '100%',
            border: '0'
          } as CSSStyleDeclaration)

          try {
            cameraView.setVideoFit?.('cover')
          } catch {}
        }

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
              scannedRef.current = false
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
    return () => stopScanner()
  }, [])

  return (
    <Box>
      <GlobalStyles
        styles={{
          '#scanner-view, #scanner-view > *': {
            width: '100%',
            height: '100%'
          },
          '#scanner-view video': {
            width: '100% !important',
            height: '100% !important',
            objectFit: 'cover !important'
          },
          '#scanner-view .dce-ui-badge, #scanner-view .dce-msg-label': {
            display: 'none !important'
          }
        }}
      />

      <Paper
        elevation={2}
        sx={{ p: 2, mb: 2, borderRadius: 2, textAlign: 'center' }}
      >
        <Box
          id='scanner-view'
          sx={{
            width: '100%',
            maxWidth: 520,
            mx: 'auto',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid #ccc',
            aspectRatio: '3 / 4',
            height: { xs: 'auto', sm: 360 }
          }}
        />
        {error && (
          <Typography color='error' mt={1.5} fontWeight='bold'>
            {error}
          </Typography>
        )}
      </Paper>

      <Drawer
        anchor='top'
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
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
            <Box sx={{ p: 2 }}>
              <UnloadConfirm
                frameless
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
              onCancel={() => setShowDrawer(false)}
              defaultItems={defaultManualItems}
            />
          </Box>
        )}
      </Drawer>
    </Box>
  )
}
