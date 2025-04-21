import express from 'express'
import { getProductCodes, getProducts } from './product.controller'
import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get('/codes', getProductCodes)

router.get('/', roleAllow(['ADMIN']), getProducts)

export default router
