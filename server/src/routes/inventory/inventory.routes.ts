import { Router } from 'express'
import { celebrate, Segments } from 'celebrate'
import roleAllow from 'middlewares/roleAllow.middleware'
import { UserRole } from 'constants/index'

import {
  getInventoriesInCart,
  getInventories,
  deleteInventory,
  updateInventories,
  addInventories,
  getInventoriesByBinCode
} from './inventory.controller'

import {
  GetInventoriesSchema,
  UpdateInventoriesSchema,
  AddInventoriesSchema,
  InventoryIDParamSchema,
  BinCodeParamSchema
} from './inventory.schema'

const router: Router = Router()

router.get(
  '/inventoriesInCart',
  roleAllow([UserRole.TRANSPORT_WORKER]),
  getInventoriesInCart
)

router.get(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.QUERY]: GetInventoriesSchema }),
  getInventories
)

router.post(
  '/',
  roleAllow([UserRole.ADMIN]),
  celebrate({ [Segments.BODY]: AddInventoriesSchema }),
  addInventories
)

router.put(
  '/',
  roleAllow([UserRole.ADMIN]),
  celebrate({ [Segments.BODY]: UpdateInventoriesSchema }),
  updateInventories
)

router.delete(
  '/:inventoryID',
  roleAllow([UserRole.ADMIN]),
  celebrate({ [Segments.PARAMS]: InventoryIDParamSchema }),
  deleteInventory
)

router.get(
  '/:binCode',
  celebrate({ [Segments.PARAMS]: BinCodeParamSchema }),
  getInventoriesByBinCode
)

export default router
