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
      CarID: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
      warehouseCode: {
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
    console.log("✅ Warehouses 表创建成功!");

    // ✅ 创建 Bins 表
    await queryInterface.createTable("Bins", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      warehouseCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      binCode: {
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
    console.log("✅ Bins 表创建成功!");

    // ✅ 创建 Inventory 表
    await queryInterface.createTable("Inventory", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
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

    // ✅ 创建 Tasks 表
    await queryInterface.createTable("Tasks", {
      ID: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      productID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceBinID: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      destinationBinID: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      assignedUserID: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "inProcess", "completed", "cancel"),
        allowNull: false,
        defaultValue: "pending",
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
    console.log("✅ Tasks 表创建成功!");

    console.log("🗑 添加外键约束...");
    await queryInterface.addConstraint("Bins", {
      fields: ["warehouseCode"],
      type: "foreign key",
      name: "fk_bins_warehouse",
      references: {
        table: "Warehouses",
        field: "warehouseCode",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    console.log("✅ 数据库结构更新完成!");
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
