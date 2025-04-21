import express from 'express'
import { getProducts, getProductsByWarehouse } from './product.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get('/codes', getProducts)

router.get('/', roleAllow(['ADMIN']), getProductsByWarehouse)

export default router
