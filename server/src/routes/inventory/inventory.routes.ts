import express from 'express'
import {
  getInventoriesInCart,
  getInventories,
  deleteInventory,
  updateInventory,
  addInventories
} from './inventory.controller'

import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/uerRole'

const router = express.Router()

router.get(
  '/inventoriesInCart',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  getInventoriesInCart
)

// admin part

router.get('/', getInventories)

router.delete('/:inventoryID', roleAllow([UserRole.ADMIN]), deleteInventory)

// router.post('/', addInventory)

router.put('/:inventoryID', updateInventory)

router.post('/', roleAllow([UserRole.ADMIN]), addInventories)

export default router
