"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ 创建 Users 表（去掉 ID，改用 accountID 作为主键）
    await queryInterface.createTable("Users", {
      accountID: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM("admin", "picker", "transportWorker"),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    // ✅ 创建 Warehouses 表
    await queryInterface.createTable("Warehouses", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      warehouseID: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    // ✅ 创建 Bins 表
    await queryInterface.createTable("Bins", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      warehouseID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      binID: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      emptyStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    // ✅ 创建 Inventory 表（包含 ownedBy 字段）
    await queryInterface.createTable("Inventory", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      warehouseID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      binID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ownedBy: {
        type: Sequelize.STRING,
        allowNull: false, // ✅ 代表库存的所有者
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    // ✅ 创建 Tasks 表（任务管理）
    await queryInterface.createTable("Tasks", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      sourceBinId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      destinationBinList: {
        type: Sequelize.STRING,
        allowNull: false, // 存储 JSON 字符串，如 "[{'binID': 'bin123', 'scanAmount': 2}, ...]"
      },
      assignedUserId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "inProgress", "completed", "cancel"),
        allowNull: false,
        defaultValue: "pending",
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // ✅ 添加外键关系
    await queryInterface.addConstraint("Bins", {
      fields: ["warehouseID"],
      type: "foreign key",
      name: "fk_bins_warehouse",
      references: {
        table: "Warehouses",
        field: "warehouseID",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Inventory", {
      fields: ["warehouseID"],
      type: "foreign key",
      name: "fk_inventory_warehouse",
      references: {
        table: "Warehouses",
        field: "warehouseID",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Inventory", {
      fields: ["binID"],
      type: "foreign key",
      name: "fk_inventory_bin",
      references: {
        table: "Bins",
        field: "binID",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Tasks", {
      fields: ["sourceBinId"],
      type: "foreign key",
      name: "fk_tasks_source_bin",
      references: {
        table: "Bins",
        field: "binID",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Tasks", {
      fields: ["assignedUserId"],
      type: "foreign key",
      name: "fk_tasks_assigned_user",
      references: {
        table: "Users",
        field: "accountID",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Tasks");
    await queryInterface.dropTable("Inventory");
    await queryInterface.dropTable("Bins");
    await queryInterface.dropTable("Warehouses");
    await queryInterface.dropTable("Users");
  },
};