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

import {
  validateAddInventories,
  validateUpdateInventory,
  validateDeleteInventory,
  validateGetInventories
} from './inventory.middleware'

const router = express.Router()

router.get(
  '/inventoriesInCart',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  getInventoriesInCart
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  validateGetInventories,
  getInventories
)

router.post(
  '/',
  roleAllow([UserRole.ADMIN]),
  validateAddInventories,
  addInventories
)

router.put(
  '/:inventoryID',
  roleAllow([UserRole.ADMIN]),
  validateUpdateInventory,
  updateInventory
)

router.delete(
  '/:inventoryID',
  roleAllow([UserRole.ADMIN]),
  validateDeleteInventory,
  deleteInventory
)

export default router
