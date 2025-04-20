import express from 'express'
import { getWarehouses, getWarehouse } from './warehouse.controller'

const router = express.Router()

router.get('/', getWarehouses)

router.get('/:warehouseID', getWarehouse)

export default router
