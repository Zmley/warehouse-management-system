'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('inventory', 'note', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('log', 'warehouseID', {
      type: Sequelize.UUID,
      allowNull: true
    })

    await queryInterface.addColumn('transfers', 'batchID', {
      type: Sequelize.UUID,
      allowNull: false
    })

    await queryInterface.addColumn('transfers', 'sourceBinCode', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('transfers', 'sourceBinCode')
    await queryInterface.removeColumn('transfers', 'batchID')
    await queryInterface.removeColumn('log', 'warehouseID')
    await queryInterface.removeColumn('inventory', 'note')
  }
}
