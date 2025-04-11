import Warehouse from './warehouse.model'

export const getWarehouses = async () => {
  return await Warehouse.findAll()
}

export const getWarehouseByID = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } })
  if (!warehouse) {
    throw new Error('Warehouse not found')
  }
  return warehouse
}
