import Image from 'next/image'
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { ProductContext } from 'contexts/ProductContextProvider'
import { useContext, useState } from 'react'
import { Product } from 'models'
import { ProductsSortMethod, ProductsSortBy, ProductsSortOrder } from 'constant'

const ProductList = () => {
  const { productFilter, dispatch, cachedPage } = useContext(ProductContext)
  const goNextPage = () => {
    dispatch({ type: 'NEXT_PAGE' })
    window.scrollTo(0, 0)
  }
  const goPreviousPage = () => {
    dispatch({ type: 'PREVIOUS_PAGE' })
    window.scrollTo(0, 0)
  }
  const [sortMethod, setSortMethod] = useState(ProductsSortMethod.newArrivals)
  return (
    <Box>
      <FormControl>
        <InputLabel>Sort by</InputLabel>
        <Select
          label='Sort by'
          value={sortMethod.value}
          onChange={event => {
            switch (event.target.value) {
              case ProductsSortMethod.newArrivals.value:
                setSortMethod(ProductsSortMethod.newArrivals)
                dispatch({
                  type: 'CHANGE_SORT_METHOD',
                  sortBy: ProductsSortBy.createdAt,
                  sortOrder: ProductsSortOrder.desc
                })
                break
              case ProductsSortMethod.priceDecrease.value:
                setSortMethod(ProductsSortMethod.priceDecrease)
                dispatch({
                  type: 'CHANGE_SORT_METHOD',
                  sortBy: ProductsSortBy.price,
                  sortOrder: ProductsSortOrder.desc
                })
                break
              case ProductsSortMethod.priceIncrease.value:
                setSortMethod(ProductsSortMethod.priceIncrease)
                dispatch({
                  type: 'CHANGE_SORT_METHOD',
                  sortBy: ProductsSortBy.price,
                  sortOrder: ProductsSortOrder.asc
                })
                break
            }
          }}
        >
          <MenuItem value={ProductsSortMethod.newArrivals.value}>
            {ProductsSortMethod.newArrivals.label}
          </MenuItem>
          <MenuItem value={ProductsSortMethod.priceIncrease.value}>
            {ProductsSortMethod.priceIncrease.label}
          </MenuItem>
          <MenuItem value={ProductsSortMethod.priceDecrease.value}>
            {ProductsSortMethod.priceDecrease.label}
          </MenuItem>
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel>Number of products per page</InputLabel>
        <Select
          label='Number of products per page'
          value={productFilter.productsPerPage}
          onChange={event => {
            dispatch({
              type: 'CHANGE_PRODUCT_FILTER',
              index: 'productsPerPage',
              value: event.target.value
            })
          }}
        >
          <MenuItem value={2}>2</MenuItem>
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={15}>15</MenuItem>
          <MenuItem value={20}>20</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label='Search'
        variant='outlined'
        onChange={event => {
          dispatch({
            type: 'CHANGE_PRODUCT_FILTER',
            index: 'keyword',
            value: event.target.value
          })
        }}
      />
      {cachedPage && (
        <Grid container>
          {cachedPage.products.map((product: Product) => (
            <Grid item xs={4} key={product._id}>
              <Image
                src={product.coverImage.url}
                alt='product-image'
                className='product-image'
                width={250}
                height={250}
              />
              <Typography variant='h2'>{product.name}</Typography>
              <Typography variant='h3'>{product.options[0].price}</Typography>
            </Grid>
          ))}
        </Grid>
      )}
      <Box>
        <Button
          className='btn-previous'
          onClick={goPreviousPage}
          disabled={productFilter.currentPage <= 1}
        >
          &lt;
        </Button>
        <Button
          className='btn-next'
          onClick={goNextPage}
          disabled={!cachedPage?.hasNextPage}
        >
          &gt;
        </Button>
      </Box>
    </Box>
  )
}

export default ProductList
