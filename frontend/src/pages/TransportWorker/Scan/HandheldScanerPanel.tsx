// src/pages/Scan/ScanGunPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Drawer, TextField, Paper } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useCart } from 'hooks/useCart'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'
import { useTaskContext } from 'contexts/task'
import LoadConfirm from '../components/LoadConfirm'
import UnloadConfirm from '../components/UnloadConfirm'
import MultiProductInputBox from '../components/ManualInputBox'
import { ScanMode } from 'constants/index'

const END_KEYS = new Set(['Enter', 'Tab'])
const IDLE_SUBMIT_MS = 150
const MIN_LENGTH_TO_SUBMIT = 1

export default function HandheldScanerPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const gunInputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)
  const idleTimerRef = useRef<number | null>(null)

  const { loadCart } = useCart()
  const { fetchInventoriesByBinCode } = useInventory()
  const { fetchProduct, loadProducts, productCodes } = useProduct()
  const { myTask } = useTaskContext()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList =
    (location.state?.unloadProductList as
      | { inventoryID: string; productCode: string; quantity: number }[]
      | undefined) ?? []

  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [unloadCartItems, setUnloadCartItems] = useState<
    { inventoryID: string; productCode: string; quantity: number }[]
  >([])
  const [defaultManualItems, setDefaultManualItems] = useState<
    { productCode: string; quantity: string }[]
  >([])
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const resetDrawerState = () => {
    setScannedBinCode(null)
    setInventoryList([])
    setUnloadCartItems([])
    setDefaultManualItems([])
  }

  const parseProductList = (text: string) =>
    text
      .split(',')
      .map(pair => {
        const [code, qty] = pair.split(':').map(s => s.trim())
        if (code && qty && /^\d+$/.test(qty))
          return { productCode: code, quantity: qty }
        return null
      })
      .filter(Boolean) as { productCode: string; quantity: string }[]

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

  const blurForDrawer = () => gunInputRef.current?.blur()
  const refocusInput = (delay = 80) =>
    setTimeout(() => gunInputRef.current?.focus(), delay)

  const submitValue = async (raw: string) => {
    if (submittingRef.current) return
    resetDrawerState()

    const trimmed = raw.replace(/[\r\n\t]+/g, '').trim()
    if (!trimmed || trimmed.length < MIN_LENGTH_TO_SUBMIT) {
      setError(t('scan.enterPrompt'))
      refocusInput(0)
      return
    }

    submittingRef.current = true
    setError(null)

    let willOpenDrawer = false
    let wasEmptyBin = false

    try {
      if (scanMode === ScanMode.UNLOAD) {
        const looksLikeMulti = trimmed.includes(':') || trimmed.includes(',')
        const looksLikeProductBarcode = /^\d{8,}$/.test(trimmed)
        if (looksLikeMulti || looksLikeProductBarcode) {
          setError(t('scan.unload.onlyBinCodeGun'))
          gunInputRef.current?.blur()
          return
        }
      }

      if (myTask) {
        const isSingleBarcode = /^\d{8,}$/.test(trimmed)
        const isMultiProduct = trimmed.includes(':') || trimmed.includes(',')
        if (isSingleBarcode || isMultiProduct) {
          setError(t('scan.taskActiveOnlyBinCode'))
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
          return
        }
        setScannedBinCode(trimmed)
        setUnloadCartItems(unloadProductList)
        willOpenDrawer = true
        setShowDrawer(true)
        blurForDrawer()
        return
      }

      if (trimmed.includes(':') || trimmed.includes(',')) {
        const parsed = parseProductList(trimmed)
        if (parsed.length > 0) {
          setDefaultManualItems(parsed)
          willOpenDrawer = true
          setShowDrawer(true)
          blurForDrawer()
          return
        }
      }

      if (/^\d{8,}$/.test(trimmed)) {
        const product = await fetchProduct(trimmed)
        if (product) {
          setDefaultManualItems([
            { productCode: product.productCode, quantity: '1' }
          ])
          willOpenDrawer = true
          setShowDrawer(true)
          blurForDrawer()
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
        return
      }

      const result = await fetchInventoriesByBinCode(trimmed)
      if (result?.inventories?.length) {
        setScannedBinCode(trimmed)
        setInventoryList(result.inventories)
        willOpenDrawer = true
        setShowDrawer(true)
        blurForDrawer()
      } else {
        setError(t('scan.noInventoryFound'))
        wasEmptyBin = true
        gunInputRef.current?.blur()
      }
    } catch (e) {
      console.error(e)
      setError(t('scan.operationError'))
    } finally {
      submittingRef.current = false
      setValue('')
      if (!willOpenDrawer && !wasEmptyBin) refocusInput(0)
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const v = e.target.value
    setValue(v)
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      if (v.trim().length >= MIN_LENGTH_TO_SUBMIT) submitValue(v)
      idleTimerRef.current = null
    }, IDLE_SUBMIT_MS)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (END_KEYS.has(e.key)) {
      e.preventDefault()
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      submitValue(value)
    }
  }

  useEffect(() => {
    gunInputRef.current?.focus()
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
    }
  }, [])

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: '1px solid #e6ebf2',
          bgcolor: 'rgba(255,255,255,0.9)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TextField
            inputRef={gunInputRef}
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
              style: {
                textAlign: 'center',
                fontWeight: 700,
                letterSpacing: 0.5
              }
            }}
          />
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

      <Drawer
        anchor='top'
        open={showDrawer}
        onClose={() => {
          setShowDrawer(false)
          resetDrawerState()
          refocusInput(120)
        }}
        PaperProps={{
          sx: {
            maxHeight: { xs: '75vh', sm: '70vh' },
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
                  resetDrawerState()
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
                resetDrawerState()
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
              onCancel={() => {
                setShowDrawer(false)
                resetDrawerState()
                refocusInput(120)
              }}
              defaultItems={defaultManualItems}
            />
          </Box>
        )}
      </Drawer>
    </Box>
  )
}
