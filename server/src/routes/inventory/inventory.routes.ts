import express from 'express'
import {
  getInventoriesInCart,
  getInventories,
  deleteInventory,
  updateInventories,
  addInventories,
  getInventoriesByBinCode
} from './inventory.controller'

import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

import {
  validateAddInventories,
  // validateUpdateInventory,
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

router.put('/', roleAllow([UserRole.ADMIN]), updateInventories)

router.delete(
  '/:inventoryID',
  roleAllow([UserRole.ADMIN]),
  validateDeleteInventory,
  deleteInventory
)

router.get('/:binCode', getInventoriesByBinCode)

export default router
