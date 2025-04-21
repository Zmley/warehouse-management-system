import express from 'express'
import {
  getInventoriesByCartID,
  getInventories,
  deleteInventory,
  addInventory,
  updateInventory
} from './inventory.controller'

import roleAllow from 'middlewares/roleAllow.middleware'

const router = express.Router()

router.get(
  '/inventoriesInCart',
  roleAllow(['TRANSPORT_WORKER']),
  getInventoriesByCartID
)

//admin part

router.get('/', getInventories)

router.delete('/:inventoryID', roleAllow(['ADMIN']), deleteInventory)

router.post('/', addInventory)

router.put('/:inventoryID', updateInventory)

export default router
