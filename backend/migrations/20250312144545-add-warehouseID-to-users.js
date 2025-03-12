"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "warehouseID", {
      type: Sequelize.STRING,
      allowNull: true, // 允许为空
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "warehouseID");
  },
};