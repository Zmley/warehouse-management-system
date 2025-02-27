"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始插入数据...");

    // ✅ 先创建 2 个仓库
    const warehouses = [
      { warehouseID: "WH-001", createdAt: new Date(), updatedAt: new Date() },
      { warehouseID: "WH-002", createdAt: new Date(), updatedAt: new Date() },
    ];
    await queryInterface.bulkInsert("Warehouses", warehouses);
    console.log("✅ Warehouses 数据插入成功!");

    // ✅ 先单独插入每个仓库的 bins
    for (const wh of warehouses) {
      const bins = [];
      for (let i = 1; i <= 3; i++) {
        bins.push({
          ID: uuidv4(),
          warehouseID: wh.warehouseID, // ✅ 直接引用 warehouseID
          binID: `BIN-${i}`, // ✅ 这里还是 BIN-1, BIN-2, BIN-3
          emptyStatus: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await queryInterface.bulkInsert("Bins", bins); // ✅ 分开插入，避免冲突
      console.log(`✅ Bins 数据插入成功! ${wh.warehouseID}`);
    }

    // ✅ 创建 Inventory，每个 Bin 3 个物品
    for (const wh of warehouses) {
      const inventory = [];
      for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
          inventory.push({
            ID: uuidv4(),
            warehouseID: wh.warehouseID,
            binID: `BIN-${i}`,
            productID: `P-${j}`,
            quantity: Math.floor(Math.random() * 20) + 1, // 1-20 随机数量
            ownedBy: "warehouse",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
      await queryInterface.bulkInsert("Inventory", inventory);
      console.log(`✅ Inventory 数据插入成功! ${wh.warehouseID}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Inventory", {});
    await queryInterface.bulkDelete("Bins", {});
    await queryInterface.bulkDelete("Warehouses", {});
    console.log("🗑 数据回滚完成!");
  },
};