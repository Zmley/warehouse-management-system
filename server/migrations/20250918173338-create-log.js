'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('log', {
      logID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      productCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      sourceBinID: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bin',
          key: 'binID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      destinationBinID: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bin',
          key: 'binID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      accountID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account',
          key: 'accountID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sessionID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      isMerged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    })

    await queryInterface.addIndex('log', ['accountID'])
    await queryInterface.addIndex('log', ['sessionID'])
    await queryInterface.addIndex('log', ['productCode', 'createdAt'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('log')
  }
}
