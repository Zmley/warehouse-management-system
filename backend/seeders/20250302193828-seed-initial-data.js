"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始插入数据...");

    // ✅ 插入 Warehouses 表
    const warehouses = await queryInterface.bulkInsert("Warehouses", [
      {
        warehouseID: Sequelize.fn("uuid_generate_v4"),
        warehouseCode: "WHCODE-001",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        warehouseID: Sequelize.fn("uuid_generate_v4"),
        warehouseCode: "WHCODE-002",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { returning: ["warehouseID", "warehouseCode"] });

    console.log("✅ Warehouses 数据插入成功!");

    // ✅ 插入 Bins 表
    const bins = [];
    for (const warehouse of warehouses) {
      for (let b = 1; b <= 3; b++) {
        bins.push({
          binID: Sequelize.fn("uuid_generate_v4"),
          warehouseCode: warehouse.warehouseCode,
          binCode: `BIN-${b}`,
          emptyStatus: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const insertedBins = await queryInterface.bulkInsert("Bins", bins, { returning: ["binID", "binCode"] });
    console.log("✅ Bins 数据插入成功!");

    // ✅ 插入 Inventory 表
    const inventory = [];
    for (const bin of insertedBins) {
      for (let p = 1; p <= 3; p++) {
        inventory.push({
          inventoryID: Sequelize.fn("uuid_generate_v4"),
          binID: bin.binID,
          productID: `P00${p}`,
          quantity: Math.floor(Math.random() * 100) + 1, // 随机 1-100 数量
          ownedBy: "U001",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert("Inventory", inventory);
    console.log("✅ Inventory 数据插入成功!");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始删除数据...");
    await queryInterface.bulkDelete("Inventory", null, {});
    await queryInterface.bulkDelete("Bins", null, {});
    await queryInterface.bulkDelete("Warehouses", null, {});
    console.log("✅ 数据删除完成!");
  },
};
