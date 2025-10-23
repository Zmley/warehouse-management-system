import express from 'express'
import {
  getProductCodes,
  // getProducts,
  addProducts,
  getProduct,
  getLowStock,
  getBoxTypes,
  getProducts,
  getLowStockWithOthers
} from './product.controller'

import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

import {
  // validateGetProducts,
  validateAddProducts,
  validateGetProduct,
  validateGetProducts
} from './product.middleware'

const router = express.Router()

router.get('/codes', getProductCodes)

router.get('/', roleAllow([UserRole.ADMIN]), validateGetProducts, getProducts)

router.get(
  '/by-barCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  validateGetProduct,
  getProduct
)

router.post(
  '/add',
  roleAllow([UserRole.ADMIN]),
  validateAddProducts,
  addProducts
)

router.get('/low-stock', roleAllow([UserRole.ADMIN]), getLowStock)

router.get('/box-types', getBoxTypes)

/////////////

router.get(
  '/low-stock-with-others',
  roleAllow([UserRole.ADMIN]),
  getLowStockWithOthers
)

export default router
