import express from 'express'
import { getAllProductCodes } from './product.controller'

const router = express.Router()

router.get('/allProduct', getAllProductCodes)

export default router
