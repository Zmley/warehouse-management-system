"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始创建数据库表...");

    // ✅ 创建 Users 表
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
    console.log("✅ Users 表创建成功!");

    // ✅ 创建 Warehouses 表
    await queryInterface.createTable("Warehouses", {
      warehouseID: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
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
    console.log("✅ Warehouses 表创建成功!");

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

    // ✅ 添加 `warehouseID` + `binID` 的组合唯一约束
    await queryInterface.addConstraint("Bins", {
      fields: ["warehouseID", "binID"],
      type: "unique",
      name: "unique_warehouse_bin",
    });

    console.log("✅ Bins 表创建成功!");

    // ✅ 创建 Inventory 表
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

    console.log("✅ Inventory 表创建成功!");

    // ✅ 创建 Tasks 表（任务管理）
    await queryInterface.createTable("Tasks", {
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
      productID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceBinId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      destinationBin: { // ✅ 修改 destinationBinList 为 destinationBin
        type: Sequelize.STRING,
        allowNull: false,
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

    console.log("✅ Tasks 表创建成功!");

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
      fields: ["warehouseID", "binID"],
      type: "foreign key",
      name: "fk_inventory_bin",
      references: {
        table: "Bins",
        fields: ["warehouseID", "binID"],
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Tasks", {
      fields: ["warehouseID", "sourceBinId"],
      type: "foreign key",
      name: "fk_tasks_source_bin",
      references: {
        table: "Bins",
        fields: ["warehouseID", "binID"],
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("Tasks", {
      fields: ["warehouseID", "destinationBin"], // ✅ 确保目标 binID 也关联 warehouseID
      type: "foreign key",
      name: "fk_tasks_destination_bin",
      references: {
        table: "Bins",
        fields: ["warehouseID", "binID"],
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

    console.log("🔗 外键约束添加成功!");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始回滚...");
    await queryInterface.dropTable("Tasks");
    await queryInterface.dropTable("Inventory");
    await queryInterface.dropTable("Bins");
    await queryInterface.dropTable("Warehouses");
    await queryInterface.dropTable("Users");
    console.log("✅ 所有表已删除!");
  },
};