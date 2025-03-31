'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const warehouses = await queryInterface.bulkInsert(
      'warehouse',
      [
        {
          warehouseCode: 'wh-001',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          warehouseCode: 'wh-002',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      { returning: ['warehouseID', 'warehouseCode'] }
    )

    const bins = []
    for (const warehouse of warehouses) {
      for (let b = 1; b <= 3; b++) {
        bins.push({
          binCode: `bin-${b}`,
          warehouseID: warehouse.warehouseID,
          type: 'INVENTORY',
          defaultProductCodes: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      bins.push({
        binCode: `cart-bin-${warehouse.warehouseCode}`,
        warehouseID: warehouse.warehouseID,
        type: 'CART',
        defaultProductCodes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const insertedBins = await queryInterface.bulkInsert('bin', bins, {
      returning: ['binID', 'binCode']
    })

    const inventory = []
    for (const bin of insertedBins) {
      for (let p = 1; p <= 3; p++) {
        inventory.push({
          binID: bin.binID,
          productCode: `p00${p}`,
          quantity: Math.floor(Math.random() * 100) + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }

    await queryInterface.bulkInsert('inventory', inventory)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('inventory', null, {})
    await queryInterface.bulkDelete('bin', null, {})
    await queryInterface.bulkDelete('warehouse', null, {})
  }
}
