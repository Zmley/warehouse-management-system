module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('inventory', {
      fields: ['binID'],
      type: 'foreign key',
      name: 'fk_inventory_bin',
      references: {
        table: 'bin',
        field: 'binID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('inventory', 'fk_inventory_bin')
  }
}
