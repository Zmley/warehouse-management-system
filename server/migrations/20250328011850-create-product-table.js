'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product', {
      productID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        primaryKey: true,
        allowNull: false
      },
      productCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product')
  }
}
