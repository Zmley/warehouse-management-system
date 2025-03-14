'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('account', {
      accountID: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM(
          'ADMIN',
          'PICKER',
          'TRANSPORT_WORKER',
          'SUPER_ADMIN'
        ),
        allowNull: false
      },
      carID: {
        type: Sequelize.STRING,
        allowNull: true
      },
      warehouseID: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('warehouse', {
      warehouseID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      warehouseCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('bin', {
      binID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      warehouseCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      binCode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('PICK_UP', 'INVENTORY', 'UNLOAD', 'CART'),
        allowNull: false
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: true
      },
      warehouseID: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('inventory', {
      inventoryID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      binID: {
        type: Sequelize.UUID,
        allowNull: false
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      ownedBy: {
        type: Sequelize.ENUM('PICK_UP', 'INVENTORY', 'UNLOAD', 'CART'),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.createTable('task', {
      taskID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('uuid_generate_v4'),
        allowNull: false,
        primaryKey: true
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sourceBinID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      destinationBinID: {
        type: Sequelize.UUID,
        allowNull: true
      },
      accountID: {
        type: Sequelize.UUID,
        allowNull: false
      },
      accepterID: {
        type: Sequelize.UUID,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CANCEL'),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    })

    await queryInterface.addConstraint('bin', {
      fields: ['warehouseCode'],
      type: 'foreign key',
      name: 'fk_bins_warehouse',
      references: {
        table: 'warehouse',
        field: 'warehouseCode'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })

    await queryInterface.addConstraint('bin', {
      fields: ['warehouseCode', 'binCode'],
      type: 'unique',
      name: 'unique_warehouse_bin'
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task')
    await queryInterface.dropTable('inventory')
    await queryInterface.dropTable('bin')
    await queryInterface.dropTable('warehouse')
    await queryInterface.dropTable('account')
  }
}
