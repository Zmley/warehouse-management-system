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
  getInventoriesByBinCode,
  getAllInventoriesForWarehouse,
  getInventoryTotalForWarehouse
} from './inventory.controller'

import {
  GetInventoriesSchema,
  UpdateInventoriesSchema,
  AddInventoriesSchema,
  InventoryIDParamSchema,
  BinCodeParamSchema
} from './inventory.schema'

const router: Router = Router()

router.get('/all', roleAllow([UserRole.ADMIN]), getAllInventoriesForWarehouse)

router.get('/total', getInventoryTotalForWarehouse)

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
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.BODY]: AddInventoriesSchema }),
  addInventories
)

router.put(
  '/',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.BODY]: UpdateInventoriesSchema }),
  updateInventories
)

router.get(
  '/:binCode/:binID?',
  roleAllow([UserRole.ADMIN, UserRole.PICKER, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.PARAMS]: BinCodeParamSchema }),
  getInventoriesByBinCode
)

router.delete(
  '/:inventoryID',
  roleAllow([UserRole.ADMIN, UserRole.TRANSPORT_WORKER]),
  celebrate({ [Segments.PARAMS]: InventoryIDParamSchema }),
  deleteInventory
)

export default router
