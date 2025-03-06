module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Bins', {
      fields: ['warehouseCode', 'binCode'],
      type: 'unique',
      name: 'unique_warehouse_bin'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Bins', 'unique_warehouse_bin');
  }
};