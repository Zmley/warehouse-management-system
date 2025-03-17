"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始插入数据...");

    // ✅ 插入 warehouse 表（不提供 warehouseID，让数据库自动生成）
    const warehouses = await queryInterface.bulkInsert(
      "warehouse",
      [
        {
          warehouseCode: "wh-001",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          warehouseCode: "wh-002",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: ["warehouseID", "warehouseCode"] } // ✅ 让数据库返回自动生成的 warehouseID
    );

    console.log("✅ warehouse 数据插入成功!", warehouses);

    // ✅ 插入 bin 表（使用数据库自动生成的 warehouseID）
    const bins = [];
    for (const warehouse of warehouses) {
      for (let b = 1; b <= 3; b++) {
        bins.push({
          binCode: `bin-${b}`,
          warehouseID: warehouse.warehouseID, // ✅ 绑定 warehouseID
          type: "INVENTORY",
          defaultProductID: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // ✅ 额外为每个 warehouse 添加一个 CART 类型的 bin
      bins.push({
        binCode: `cart-bin-${warehouse.warehouseCode}`,
        warehouseID: warehouse.warehouseID, // ✅ 绑定 warehouseID
        type: 'CART', // ✅ 设置 type 为 CART
        defaultProductID: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const insertedBins = await queryInterface.bulkInsert("bin", bins, {
      returning: ["binID", "binCode"],
    });
    console.log("✅ bin 数据插入成功!", insertedBins);

    // ✅ 插入 inventory 表
    const inventory = [];
    for (const bin of insertedBins) {
      for (let p = 1; p <= 3; p++) {
        inventory.push({
          binID: bin.binID,
          productID: `p00${p}`,
          quantity: Math.floor(Math.random() * 100) + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert("inventory", inventory);
    console.log("✅ inventory 数据插入成功!");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始删除数据...");
    await queryInterface.bulkDelete("inventory", null, {});
    await queryInterface.bulkDelete("bin", null, {});
    await queryInterface.bulkDelete("warehouse", null, {});
    console.log("✅ 数据删除完成！");
  },
};