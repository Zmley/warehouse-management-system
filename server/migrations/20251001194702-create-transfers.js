'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes, fn } = Sequelize

    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    )

    await queryInterface.createTable('transfers', {
      transferID: {
        type: DataTypes.UUID,
        defaultValue: fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },

      taskID: {
        type: DataTypes.UUID,
        allowNull: true
      },

      sourceWarehouseID: {
        type: DataTypes.UUID,
        allowNull: false
      },
      destinationWarehouseID: {
        type: DataTypes.UUID,
        allowNull: false
      },

      sourceBinID: {
        type: DataTypes.UUID,
        allowNull: true
      },

      destinationBinID: {
        type: DataTypes.UUID,
        allowNull: true
      },

      productCode: {
        type: DataTypes.STRING,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      status: {
        type: DataTypes.ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CANCELED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },

      createdBy: {
        type: DataTypes.UUID,
        allowNull: false
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: fn('NOW')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: fn('NOW')
      }
    })

    // ==== 外键约束 ====

    await queryInterface.addConstraint('transfers', {
      fields: ['taskID'],
      type: 'foreign key',
      name: 'fk_transfers_task',
      references: { table: 'task', field: 'taskID' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('transfers', {
      fields: ['sourceWarehouseID'],
      type: 'foreign key',
      name: 'fk_transfers_source_warehouse',
      references: { table: 'warehouse', field: 'warehouseID' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('transfers', {
      fields: ['destinationWarehouseID'],
      type: 'foreign key',
      name: 'fk_transfers_destination_warehouse',
      references: { table: 'warehouse', field: 'warehouseID' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('transfers', {
      fields: ['sourceBinID'],
      type: 'foreign key',
      name: 'fk_transfers_source_bin',
      references: { table: 'bin', field: 'binID' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('transfers', {
      fields: ['destinationBinID'],
      type: 'foreign key',
      name: 'fk_transfers_destination_bin',
      references: { table: 'bin', field: 'binID' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('transfers', {
      fields: ['createdBy'],
      type: 'foreign key',
      name: 'fk_transfers_created_by',
      references: { table: 'account', field: 'accountID' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addIndex('transfers', ['status'], {
      name: 'idx_transfers_status'
    })
    await queryInterface.addIndex('transfers', ['productCode'], {
      name: 'idx_transfers_product'
    })
    await queryInterface.addIndex(
      'transfers',
      ['sourceWarehouseID', 'destinationWarehouseID'],
      {
        name: 'idx_transfers_src_dst_wh'
      }
    )
  },

  down: async queryInterface => {
    await queryInterface
      .removeIndex('transfers', 'idx_transfers_status')
      .catch(() => {})
    await queryInterface
      .removeIndex('transfers', 'idx_transfers_product')
      .catch(() => {})
    await queryInterface
      .removeIndex('transfers', 'idx_transfers_src_dst_wh')
      .catch(() => {})

    await queryInterface
      .removeConstraint('transfers', 'fk_transfers_task')
      .catch(() => {})
    await queryInterface
      .removeConstraint('transfers', 'fk_transfers_source_warehouse')
      .catch(() => {})
    await queryInterface
      .removeConstraint('transfers', 'fk_transfers_destination_warehouse')
      .catch(() => {})
    await queryInterface
      .removeConstraint('transfers', 'fk_transfers_source_bin')
      .catch(() => {})
    await queryInterface
      .removeConstraint('transfers', 'fk_transfers_destination_bin')
      .catch(() => {})
    await queryInterface
      .removeConstraint('transfers', 'fk_transfers_created_by')
      .catch(() => {})

    await queryInterface.dropTable('transfers')

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_transfers_status";'
      )
    }
  }
}
