'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('task', 'note', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.sequelize.query(
      "UPDATE task SET note = 'RUSH_TASK' WHERE note IN ('加急','URGENT');"
    )
  },

  down: async queryInterface => {
    await queryInterface.removeColumn('task', 'note')
  }
}
