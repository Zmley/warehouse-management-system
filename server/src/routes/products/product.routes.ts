import express from 'express'
import {
  getProductCodes,
  getProducts,
  addProducts,
  getProduct
} from './product.controller'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

const router = express.Router()

router.get('/codes', getProductCodes)

router.get('/', roleAllow(['ADMIN']), getProducts)

router.get(
  '/by-barCode',
  roleAllow([UserRole.TRANSPORT_WORKER, UserRole.PICKER]),
  getProduct
)

router.post('/add', roleAllow(['ADMIN']), addProducts)

export default router
