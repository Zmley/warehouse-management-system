"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ 先检查 `Bins` 表中是否已存在 `BIN-001` 和 `BIN-002`
    const binsExist = await queryInterface.sequelize.query(
      `SELECT COUNT(*) FROM "Bins" WHERE "binID" IN ('BIN-001', 'BIN-002');`
    );

    if (binsExist[0][0].count === "0") {
      // ✅ 先插入 `Bins` 表
      await queryInterface.bulkInsert("Bins", [
        {
          ID: uuidv4(),
          warehouseID: "WH-001", // 确保 `WH-001` 已存在
          binID: "BIN-001",
          emptyStatus: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          ID: uuidv4(),
          warehouseID: "WH-001", // 确保 `WH-001` 已存在
          binID: "BIN-002",
          emptyStatus: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    // ✅ 现在 `Bins` 里面已经有 `BIN-001` 和 `BIN-002`，可以插入 `Inventory`
    return queryInterface.bulkInsert("Inventory", [
      {
        ID: uuidv4(),
        warehouseID: "WH-001",
        binID: "BIN-001",
        productID: "P-1001",
        quantity: 10,
        ownedBy: "warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        warehouseID: "WH-001",
        binID: "BIN-001",
        productID: "P-1002",
        quantity: 15,
        ownedBy: "warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        warehouseID: "WH-001",
        binID: "BIN-001",
        productID: "P-1003",
        quantity: 20,
        ownedBy: "warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        warehouseID: "WH-001",
        binID: "BIN-002",
        productID: "P-2001",
        quantity: 8,
        ownedBy: "warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        warehouseID: "WH-001",
        binID: "BIN-002",
        productID: "P-2002",
        quantity: 12,
        ownedBy: "warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ID: uuidv4(),
        warehouseID: "WH-001",
        binID: "BIN-002",
        productID: "P-2003",
        quantity: 18,
        ownedBy: "warehouse",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Inventory", { warehouseID: "WH-001" });
    await queryInterface.bulkDelete("Bins", { binID: ["BIN-001", "BIN-002"] });
  },
};