import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material'
import { useState, useEffect } from 'react'
import { useProduct } from 'hooks/useProduct'

const ProductDetail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const barCode = location.state?.barCode

  const { fetchProduct, isLoading, error } = useProduct()
  const [product, setProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState<string>('1')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!barCode) return

    const load = async () => {
      const result = await fetchProduct(barCode)
      if (result) setProduct(result)
    }

    load()
  }, [barCode])

  const handleSubmit = () => {
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setSubmitError('❌ Quantity must be a positive number.')
      return
    }

    console.log('🛒 Add to cart:', {
      productCode: product.productCode,
      quantity: qty
    })

    alert('✅ Product added to cart')
    navigate(-1)
  }

  if (!barCode) {
    return <Alert severity='error'>❌ No barCode provided.</Alert>
  }

  if (isLoading) {
    return (
      <Box textAlign='center' mt={6}>
        <CircularProgress />
        <Typography mt={2}>Loading product info...</Typography>
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (!product) {
    return <Alert severity='info'>🔍 No product found for this barcode.</Alert>
  }

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 6,
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'
      }}
    >
      <Typography variant='h5' fontWeight='bold' gutterBottom>
        Add Product to Cart
      </Typography>

      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='subtitle1'>
            <strong>Product Code:</strong> {product.productCode}
          </Typography>
          <Typography variant='subtitle1'>
            <strong>Bar Code:</strong> {product.barCode}
          </Typography>
          <Typography variant='subtitle1'>
            <strong>Box Type:</strong> {product.boxType}
          </Typography>
          <Typography variant='subtitle2' color='text.secondary'>
            Created At: {new Date(product.createdAt).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      <TextField
        label='Quantity'
        type='number'
        fullWidth
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        error={!!submitError}
        helperText={submitError}
        sx={{ mb: 2 }}
      />

      <Button
        variant='contained'
        color='primary'
        fullWidth
        onClick={handleSubmit}
      >
        Add to Cart
      </Button>
    </Box>
  )
}

export default ProductDetail
