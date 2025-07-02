import express from 'express'
import {
  getProductCodes,
  getProducts,
  addProducts,
  getProduct
} from './product.controller'

import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

import {
  validateGetProducts,
  validateAddProducts,
  validateGetProduct
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

export default router
