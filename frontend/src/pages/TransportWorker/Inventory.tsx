import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Autocomplete,
  TextField,
  InputAdornment,
  IconButton,
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

const InventoryPage: React.FC = () => {
  const { t } = useTranslation()
  const [inputProduct, setInputProduct] = useState('')
  const [productCode, setProductCode] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const { fetchInventories, inventories } = useInventory()
  const { fetchProductCodes, productCodes } = useProduct()

  useEffect(() => {
    fetchProductCodes()
  }, [])

  const handleSearch = async () => {
    if (!productCode) return
    setHasSearched(true)
    setIsFetching(true)
    await fetchInventories(productCode)
    setIsFetching(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <Box p={2} sx={{ maxWidth: '100%', mx: 'auto' }}>
      <Typography variant='h6' fontWeight={600} mb={2} textAlign='center'>
        {t('inventorySearch.title', 'Inventory')}
      </Typography>

      <Autocomplete
        options={productCodes}
        value={productCode}
        inputValue={inputProduct}
        onInputChange={(_, newInput) => setInputProduct(newInput)}
        onChange={(_, newValue) => setProductCode(newValue || '')}
        filterOptions={options =>
          inputProduct.trim() === ''
            ? []
            : options.filter(opt =>
                opt.toLowerCase().includes(inputProduct.toLowerCase())
              )
        }
        renderInput={params => (
          <TextField
            {...params}
            placeholder={t(
              'inventorySearch.searchPlaceholder',
              'Search by product code'
            )}
            onKeyDown={handleKeyPress}
            InputProps={{
              ...params.InputProps,
              startAdornment: null,
              endAdornment: (
                <>
                  {params.InputProps.endAdornment}
                  <InputAdornment position='end'>
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                </>
              )
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          />
        )}
        noOptionsText={
          inputProduct.trim() === ''
            ? ''
            : t('inventorySearch.noOptions', 'No options')
        }
      />

      {!hasSearched ? (
        <Typography textAlign='center' color='text.secondary'>
          {t(
            'inventorySearch.pleaseSearch',
            'Please enter a product code and search.'
          )}
        </Typography>
      ) : isFetching ? (
        <Box display='flex' justifyContent='center' mt={4}>
          <CircularProgress />
        </Box>
      ) : inventories.length === 0 ? (
        <Typography textAlign='center' color='text.secondary'>
          {t('inventorySearch.noResult', 'No inventory found.')}
        </Typography>
      ) : (
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: 'auto',
            border: '2px solid #1976d2' // 蓝色边框
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
                  {t('inventorySearch.binCode', 'Bin Code')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('inventorySearch.productCode', 'Product Code')}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {t('inventorySearch.quantity', 'Quantity')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventories.map(item => (
                <TableRow key={item.inventoryID}>
                  <TableCell>{item.bin?.binCode || '--'}</TableCell>
                  <TableCell>{item.productCode}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  )
}

export default InventoryPage
