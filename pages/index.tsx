import type { NextPage } from 'next'
import ProductList from 'components/ProductList/ProductList'
import ProductContextProvider from 'contexts/ProductContextProvider'

const Home: NextPage = () => {
  return (
    <ProductContextProvider>
      <ProductList />
    </ProductContextProvider>
  )
}

export default Home
