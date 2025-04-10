import express from 'express'
import {
  getInventoriesByCart,
  getAllInventoriesController,
  deleteInventoryItemController,
  addInventoryItemController,
  updateInventoryItemController
} from './inventory.controller'
import transportWorkerOnly from '../../middlewares/transportWorker.middleware'
import adminOnly from 'middlewares/admin.middleware'

const router = express.Router()

router.get('/inventoriesInCart', transportWorkerOnly, getInventoriesByCart)

//admin part

router.get('/all', adminOnly, getAllInventoriesController)

router.delete('/:inventoryID', adminOnly, deleteInventoryItemController)

router.post('/', addInventoryItemController)

router.put('/:inventoryID', updateInventoryItemController)

export default router
