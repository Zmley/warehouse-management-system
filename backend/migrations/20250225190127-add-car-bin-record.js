'use strict';
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 插入一个新的仓库记录
    await queryInterface.bulkInsert("Warehouses", [
      {
        ID: uuidv4(),
        warehouseID: "your-warehouse-id", // 替换为实际的仓库ID
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    // 插入一个新的 bin 记录
    await queryInterface.bulkInsert("Bins", [
      {
        ID: uuidv4(),
        warehouseID: "your-warehouse-id", // 使用刚插入的仓库ID
        binID: "car", // 新的 binID
        emptyStatus: false, // 根据需要设置字段
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除 Bins 表中的 'car' 记录
    await queryInterface.bulkDelete("Bins", { binID: "car" });

    // 删除刚插入的仓库记录
    await queryInterface.bulkDelete("Warehouses", { warehouseID: "your-warehouse-id" });
  }
};