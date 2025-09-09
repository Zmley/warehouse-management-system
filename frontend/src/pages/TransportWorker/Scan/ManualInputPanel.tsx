import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  Drawer,
  TextField,
  Paper,
  Stack
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTranslation } from 'react-i18next'

import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'
import { useTaskContext } from 'contexts/task'

import LoadConfirm from '../components/LoadConfirm'
import UnloadConfirm from '../components/UnloadConfirm'
import MultiProductInputBox from '../components/ManualInputBox'
import { ScanMode } from 'constants/index'

export default function ManualInputPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const { myTask } = useTaskContext()
  const { loadCart } = useCart()
  const { fetchInventoriesByBinCode } = useInventory()
  const { loadProducts, productCodes } = useProduct()
  const { fetchBinCodes, binCodes } = useBin()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList =
    (location.state?.unloadProductList as
      | { inventoryID: string; productCode: string; quantity: number }[]
      | undefined) ?? []

  // —— BinCode 联想输入 ——
  const [binInput, setBinInput] = useState<string>('')
  const autoRef = useRef<HTMLInputElement>(null)
  const blurInput = () => autoRef.current?.blur()
  const refocusInput = (ms = 120) =>
    setTimeout(() => autoRef.current?.focus(), ms)

  const [showDrawer, setShowDrawer] = useState(false)
  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [unloadCartItems, setUnloadCartItems] = useState<
    { inventoryID: string; productCode: string; quantity: number }[]
  >([])
  const [defaultManualItems, setDefaultManualItems] = useState<
    { productCode: string; quantity: string }[]
  >([])

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [fetchBinCodes, loadProducts])

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

  /** 确认货位 */
  const handleConfirmBin = async () => {
    const trimmed = binInput.trim()
    if (!trimmed) {
      setError(t('scan.enterPrompt'))
      // 不 blur；让用户继续输入
      refocusInput(10)
      return
    }

    setError(null)
    setLoading(true)
    // 先 blur 一下，移动端收起键盘，看清反馈
    blurInput()

    try {
      if (scanMode === ScanMode.UNLOAD) {
        const { ok, allowed } = isBinAllowedForMode(ScanMode.UNLOAD, trimmed)
        if (!ok) {
          setError(
            t('scan.onlyUnloadToAssigned', {
              allowed: allowed.join(', '),
              received: trimmed
            })
          )
          refocusInput()
          return
        }
        setScannedBinCode(trimmed)
        setUnloadCartItems(unloadProductList)
        setShowDrawer(true)
        return
      }

      // LOAD: 校验 + 拉库存
      const { ok, allowed } = isBinAllowedForMode(ScanMode.LOAD, trimmed)
      if (!ok) {
        setError(
          t('scan.onlyLoadFromAssigned', {
            allowed: allowed.join(', '),
            received: trimmed
          })
        )
        refocusInput()
        return
      }

      const result = await fetchInventoriesByBinCode(trimmed)
      if (result?.inventories?.length) {
        setScannedBinCode(trimmed)
        setInventoryList(result.inventories)
        setShowDrawer(true)
      } else {
        // 没有库存：明确提示，并保持表单简洁
        setError(t('scan.noInventoryFound'))
        // 这里不立即回焦，给用户看清提示；稍后回焦
        refocusInput()
      }
    } catch (e) {
      console.error(e)
      setError(t('scan.operationError'))
      refocusInput()
    } finally {
      setLoading(false)
    }
  }

  /** 打开“手动录入产品”抽屉（与之前保持一致） */
  const openManualProductsDrawer = () => {
    setScannedBinCode(null)
    setInventoryList([])
    setUnloadCartItems([])
    setDefaultManualItems([])
    setShowDrawer(true)
    blurInput()
  }

  return (
    <Box>
      <Paper
        elevation={1}
        sx={{
          p: 1.25,
          borderRadius: 2,
          border: '1px solid #e6ebf2',
          bgcolor: 'rgba(255,255,255,0.95)'
        }}
      >
        <Stack spacing={1.25}>
          {/* 货位确认：带联想的紧凑输入区 */}
          <Stack direction='row' spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Autocomplete
                options={binCodes}
                value={binInput}
                onInputChange={(_, val) => setBinInput(val)}
                onChange={(_, val) => setBinInput(val || '')}
                filterOptions={(options, state) =>
                  state.inputValue.length === 0
                    ? []
                    : options.filter(opt =>
                        opt
                          .toLowerCase()
                          .includes(state.inputValue.toLowerCase())
                      )
                }
                openOnFocus={false}
                renderInput={params => (
                  <TextField
                    {...params}
                    inputRef={autoRef}
                    size='small'
                    label={t('scan.inputBinCode')}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleConfirmBin()
                      }
                    }}
                  />
                )}
              />
            </Box>
            <Button
              variant='contained'
              onClick={handleConfirmBin}
              disabled={loading}
              sx={{
                px: 2.25,
                minWidth: 92,
                fontWeight: 800,
                borderRadius: 2
              }}
            >
              {t('scan.confirm')}
            </Button>
          </Stack>

          {/* 手动录入产品按钮（打开抽屉） */}
          <Stack direction='row' spacing={1}>
            <Button
              variant='outlined'
              onClick={openManualProductsDrawer}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {t('scan.manualInputButton')}
            </Button>
          </Stack>

          {/* 错误提示（紧凑样式） */}
          {error && (
            <Typography
              variant='body2'
              color='error'
              fontWeight={700}
              sx={{ lineHeight: 1.3 }}
            >
              {error}
            </Typography>
          )}
        </Stack>
      </Paper>

      {/* 顶部抽屉（Unload / Load / 手动录入 共用） */}
      <Drawer
        anchor='top'
        open={showDrawer}
        onClose={() => {
          setShowDrawer(false)
          refocusInput()
        }}
        PaperProps={{
          sx: {
            maxHeight: '88vh',
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
            <Box sx={{ p: 1.25 }}>
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
          ) : (
            <Box sx={{ p: 1.25 }}>
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
          )
        ) : scannedBinCode && inventoryList.length > 0 ? (
          <Box sx={{ p: 1.25 }}>
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
          <Box sx={{ p: 1.25 }}>
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
