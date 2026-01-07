import express from 'express'
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from './warehouse.controller'

const router = express.Router()

router.get('/', getWarehouses)

router.post('/', createWarehouse)

router.get('/:warehouseID', getWarehouse)

router.patch('/:warehouseID', updateWarehouse)

router.delete('/:warehouseID', deleteWarehouse)

export default router
