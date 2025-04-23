import express from 'express'
import {
  getProductCodes,
  getProducts,
  uploadProducts
} from './product.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get('/codes', getProductCodes)

router.get('/', roleAllow(['ADMIN']), getProducts)

router.post('/add', roleAllow(['ADMIN']), uploadProducts)

export default router
