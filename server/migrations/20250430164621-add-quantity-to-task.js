'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('task', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('task', 'quantity')
  }
}
