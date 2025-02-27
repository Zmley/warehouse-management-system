"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始添加 'car' bins...");

    // 目标仓库
    const warehouses = ["WH-001", "WH-002"];

    // ✅ 先检查是否已经有 `car` bin
    const existingBins = await queryInterface.sequelize.query(
      `SELECT "warehouseID" FROM "Bins" WHERE "binID" = 'car';`
    );

    const existingWarehouseIDs = existingBins[0].map(bin => bin.warehouseID);

    // 过滤出还没有 `car` bin 的仓库
    const binsToInsert = warehouses
      .filter(whID => !existingWarehouseIDs.includes(whID))
      .map(whID => ({
        ID: uuidv4(),
        warehouseID: whID,
        binID: "car",
        emptyStatus: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (binsToInsert.length > 0) {
      await queryInterface.bulkInsert("Bins", binsToInsert);
      console.log("✅ 'car' bins 添加成功!");
    } else {
      console.log("⚠️ 'car' bins 已存在，跳过插入。");
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始删除 'car' bins...");
    await queryInterface.bulkDelete("Bins", { binID: "car" });
    console.log("✅ 'car' bins 已删除!");
  },
};