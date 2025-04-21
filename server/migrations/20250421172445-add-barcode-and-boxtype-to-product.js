'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('product', 'barCode', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('product', 'boxType', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('product', 'barCode')
    await queryInterface.removeColumn('product', 'boxType')
  }
}
