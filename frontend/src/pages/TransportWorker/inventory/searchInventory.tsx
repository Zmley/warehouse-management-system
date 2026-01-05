import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Autocomplete,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { useInventory } from 'hooks/useInventory'
import { useProduct } from 'hooks/useProduct'

const Inventory: React.FC = () => {
  const { t } = useTranslation()
  const [productCode, setProductCode] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const { fetchInventories, inventories } = useInventory()
  const { fetchProductCodes, productCodes } = useProduct()

  useEffect(() => {
    fetchProductCodes()
  }, [fetchProductCodes])

  const handleSearch = async (code: string) => {
    const kw = code.trim()
    if (!kw) return
    setIsFetching(true)
    try {
      await fetchInventories({ keyword: kw, limit: 100 })
    } finally {
      setIsFetching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(productCode)
  }

  const norm = (s: string) => (s || '').trim().toLowerCase()

  return (
    <Box p={2} sx={{ mx: 'auto' }}>
      <Typography variant='h6' fontWeight={600} mb={2} textAlign='center'>
        {t('inventorySearch.title')}
      </Typography>

      <Box
        display='flex'
        justifyContent='center'
        mb={3}
        sx={{ maxWidth: 400, mx: 'auto' }}
      >
        <Autocomplete
          fullWidth
          freeSolo
          options={productCodes}
          filterOptions={(options, { inputValue }) => {
            const q = norm(inputValue)
            if (!q) return []
            return options.filter(opt => norm(opt).startsWith(q)).slice(0, 5)
          }}
          value={null}
          inputValue={productCode}
          onInputChange={(_, v) => setProductCode(v || '')}
          onChange={(_, v) => {
            if (typeof v === 'string') {
              setProductCode(v)
              handleSearch(v)
            }
          }}
          autoHighlight
          renderInput={params => (
            <TextField
              {...params}
              onKeyDown={handleKeyPress}
              placeholder={t('inventorySearch.searchPlaceholder')}
              size='small'
              InputProps={{
                ...params.InputProps,
                sx: {
                  pl: 2,
                  pr: 1,
                  py: 0.5,
                  backgroundColor: '#fff',
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  '& fieldset': { border: '1px solid #ccc' },
                  '&:hover fieldset': { borderColor: '#888' }
                },
                endAdornment: (
                  <InputAdornment position='end'>
                    <SearchIcon sx={{ color: '#888', fontSize: 20, mr: 1 }} />
                  </InputAdornment>
                )
              }}
            />
          )}
          noOptionsText={
            productCode.trim() === '' ? '' : t('inventorySearch.noOptions')
          }
        />
      </Box>

      {isFetching ? (
        <Box display='flex' justifyContent='center' mt={4}>
          <CircularProgress />
        </Box>
      ) : inventories.length === 0 ? (
        <Typography textAlign='center' color='text.secondary'>
          {t('inventorySearch.noResult')}
        </Typography>
      ) : (
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: 'auto',
            border: '2px solid #1976d2',
            maxWidth: 400,
            mx: 'auto'
          }}
        >
          <Table
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              '& td, & th': {
                border: '1px solid #ddd',
                fontSize: '0.85rem',
                padding: '6px',
                textAlign: 'center'
              }
            }}
          >
            <TableHead sx={{ backgroundColor: '#f5f8fc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('inventorySearch.binCode')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('inventorySearch.productCode')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('inventorySearch.quantity')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('inventorySearch.note', 'Note')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventories.map(item => (
                <TableRow key={item.inventoryID}>
                  <TableCell>{item.bin?.binCode || '--'}</TableCell>
                  <TableCell>{item.productCode}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {(((item as any)?.note ?? '') as string).trim() || '--'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  )
}

export default Inventory
