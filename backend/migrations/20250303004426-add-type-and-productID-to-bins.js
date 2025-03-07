"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始更新 Bins 表，添加 type 和 productID 字段...");

    await queryInterface.addColumn("Bins", "type", {
      type: Sequelize.ENUM("pick up", "inventory", "unload"),
      allowNull: false,
      defaultValue: "inventory",
    });

    await queryInterface.addColumn("Bins", "productID", {
      type: Sequelize.STRING,
      allowNull: true, // 允许为空
    });

    console.log("✅ Bins 表字段添加成功!");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始回滚 Bins 表字段更新...");

    await queryInterface.removeColumn("Bins", "type");
    await queryInterface.removeColumn("Bins", "productID");

    console.log("✅ Bins 表字段已回滚!");
  },
};
