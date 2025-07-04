import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
  Checkbox,
  TextField
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { InventoryItem } from 'types/inventory'
import { useNavigate } from 'react-router-dom'
import { useTaskContext } from 'contexts/task'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

interface LoadConfirmProps {
  binCode: string
  inventories: InventoryItem[]
  onSuccess?: () => void
}

type InventoryWithSelection = InventoryItem & {
  selected: boolean
  loadQuantity: number
}

const LoadConfirm: React.FC<LoadConfirmProps> = ({ binCode, inventories }) => {
  const { t } = useTranslation()
  const { loadCart } = useCart()
  const navigate = useNavigate()
  const { myTask } = useTaskContext()

  const [inventoryList, setInventoryList] = useState<InventoryWithSelection[]>(
    []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const taskProductCode = myTask?.productCode
  const taskQuantity = myTask?.quantity
  const isTaskMode = taskProductCode !== null && taskQuantity !== null

  useEffect(() => {
    const newList = inventories.map(item => {
      const isTaskProduct = item.productCode === taskProductCode
      const selected = isTaskMode && isTaskProduct

      const quantity = selected
        ? taskQuantity === 0
          ? item.quantity
          : taskQuantity
        : 0

      return {
        ...item,
        selected,
        loadQuantity: quantity ?? 0
      }
    })

    setInventoryList(newList)
  }, [inventories, taskProductCode, taskQuantity])

  const handleQuantityChange = (inventoryID: string, quantity: number) => {
    setInventoryList(prev =>
      prev.map(item =>
        item.inventoryID === inventoryID
          ? {
              ...item,
              loadQuantity: Math.min(Math.max(0, quantity), item.quantity)
            }
          : item
      )
    )
  }

  const handleCheckboxChange = (inventoryID: string) => {
    setInventoryList(prev =>
      prev.map(item => {
        if (item.inventoryID === inventoryID) {
          const newSelected = !item.selected
          return {
            ...item,
            selected: newSelected,
            loadQuantity: newSelected ? item.quantity : 0
          }
        }
        return item
      })
    )
  }

  const validateSelection = (): boolean => {
    const selectedItems = inventoryList.filter(item => item.selected)

    if (selectedItems.length === 0) {
      setError(t('load.selectAtLeastOne'))
      return false
    }

    for (const item of selectedItems) {
      if (item.loadQuantity > item.quantity) {
        return false
      }
    }

    return true
  }

  const handleConfirm = async () => {
    if (!validateSelection()) return

    try {
      setLoading(true)
      setError(null)

      const selectedItems = inventoryList
        .filter(item => item.selected)
        .map(({ inventoryID, loadQuantity }) => ({
          inventoryID,
          quantity: loadQuantity
        }))

      const result = await loadCart({ binCode, selectedItems })

      if (result.success) {
        navigate('/success')
      } else {
        setError(result.error || t('load.error'))
      }
    } catch (err) {
      console.error('❌ Load failed:', err)
      setError(t('load.error') || 'Failed to load items.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 2,
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px #00000010'
      }}
    >
      <CardContent sx={{ p: 1 }}>
        <Typography
          fontWeight={600}
          fontSize={11}
          gutterBottom
          textAlign='center'
        >
          {t('load.confirmTitle', { binCode })}
        </Typography>

        <Divider sx={{ mb: 1 }} />

        {inventoryList.map(item => {
          const isTaskProduct = item.productCode === taskProductCode

          return (
            <Box
              key={item.inventoryID}
              display='flex'
              alignItems='center'
              sx={{
                bgcolor: '#e3f2fd',
                borderRadius: 1,
                p: 1,
                mb: 1,
                opacity: item.selected || isTaskProduct ? 1 : 0.6
              }}
            >
              <Checkbox
                checked={item.selected}
                onChange={() => handleCheckboxChange(item.inventoryID)}
                sx={{ mr: 1, p: 0.5 }}
                size='small'
              />

              <Box flex={1} sx={{ minWidth: 0 }}>
                <Typography fontWeight={600} fontSize={12} noWrap>
                  #{item.productCode}
                </Typography>
                <Typography fontSize={10} color='text.secondary' noWrap>
                  {t('load.productQuantity')} {item.quantity}
                </Typography>
              </Box>

              <Box ml={1} display='flex' alignItems='center' gap={0.5}>
                <Typography fontSize={10} color='text.secondary'>
                  {t('load.inputQuantity')}
                </Typography>
                <TextField
                  type='number'
                  size='small'
                  value={item.loadQuantity}
                  onChange={e =>
                    handleQuantityChange(
                      item.inventoryID,
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  disabled={!item.selected}
                  sx={{
                    width: 52,
                    backgroundColor: '#f0f4f8',
                    borderRadius: 1
                  }}
                  inputProps={{
                    min: 0,
                    max: item.quantity,
                    style: { fontSize: 11, padding: 5 }
                  }}
                />
              </Box>
            </Box>
          )
        })}

        {error && (
          <Typography
            color='error'
            mt={1}
            textAlign='center'
            fontWeight='bold'
            fontSize={11}
          >
            {error}
          </Typography>
        )}

        <Box mt={2} textAlign='center'>
          <ArrowDownwardIcon
            sx={{
              color: '#1976d2',
              fontSize: 24,
              mb: 0.5
            }}
          />

          <Button
            variant='contained'
            color='primary'
            onClick={handleConfirm}
            disabled={loading}
            fullWidth
            sx={{
              height: 44,
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 2
            }}
          >
            {t('load.confirm')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default LoadConfirm
