import Warehouse from './warehouse.model'

export const getWarehouses = async () => {
  try {
    return await Warehouse.findAll()
  } catch (error) {
    throw new Error('Failed to fetch warehouses')
  }
}

export const getWarehouseByID = async (warehouseID: string) => {
  try {
    const warehouse = await Warehouse.findOne({ where: { warehouseID } })

    if (!warehouse) {
      throw new Error(`❌ Warehouse not found with ID: ${warehouseID}`)
    }

    return warehouse
  } catch (error) {
    throw new Error('Failed to fetch warehouse by ID')
  }
}
