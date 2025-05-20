import { Box, Button, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useCart } from 'hooks/useCart'
import { ProductType } from 'types/product'

interface Props {
  product: ProductType
  onSuccess?: () => void
}

const AddToCartInline = ({ product, onSuccess }: Props) => {
  const { loadCart } = useCart()
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setError('❌ Invalid quantity')
      return
    }

    const res = await loadCart({
      productCode: product.productCode,
      quantity: qty
    })
    if (res.success) {
      onSuccess?.()
    } else {
      setError(res.error || '❌ Failed to add')
    }
  }

  return (
    <Box
      display='flex'
      alignItems='center'
      gap={2}
      mt={3}
      justifyContent='center'
    >
      <Typography fontWeight='bold'>{product.productCode}</Typography>
      <TextField
        type='number'
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
        size='small'
        sx={{ width: 80 }}
      />
      <Button variant='contained' onClick={handleSubmit}>
        Add
      </Button>
      {error && (
        <Typography color='error' fontSize={12}>
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default AddToCartInline
