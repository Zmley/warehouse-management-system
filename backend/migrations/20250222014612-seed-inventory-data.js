"use strict";

const { v4: uuidv4 } = require("uuid"); // 引入 UUID 生成库

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("inventory", [
      {
        id: uuidv4(), // ✅ 直接生成 UUID
        warehouse_code: "WH001",
        bin_code: "BIN001",
        product_code: "P001",
        quantity: 50,
        bin_qr_code: "https://example.com/qrcode/BIN001",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        warehouse_code: "WH001",
        bin_code: "BIN002",
        product_code: "P002",
        quantity: 30,
        bin_qr_code: "https://example.com/qrcode/BIN002",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        warehouse_code: "WH002",
        bin_code: "BIN003",
        product_code: "P003",
        quantity: 40,
        bin_qr_code: "https://example.com/qrcode/BIN003",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        warehouse_code: "WH002",
        bin_code: "BIN004",
        product_code: "P004",
        quantity: 60,
        bin_qr_code: "https://example.com/qrcode/BIN004",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        warehouse_code: "WH003",
        bin_code: "BIN005",
        product_code: "P005",
        quantity: 20,
        bin_qr_code: "https://example.com/qrcode/BIN005",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("inventory", null, {});
  },
};