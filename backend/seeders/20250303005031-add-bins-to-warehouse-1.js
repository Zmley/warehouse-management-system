const { v4: uuidv4 } = require("uuid"); // ✅ 引入 UUID 生成器

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始向 `Bins` 表插入属于 `warehouse-1` 的 `bin`...");

    await queryInterface.bulkInsert("Bins", [
      {
        binID: uuidv4(), // ✅ 生成 UUID
        warehouseCode: "WHCODE-001", 
        binCode: "BIN-3", // ✅ 生成 UUID
        type: "inventory",
        productID: "null",
        emptyStatus: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        binID: uuidv4(), // ✅ 生成 UUID
        warehouseCode: "WHCODE-001", 
        binCode: "BIN-4", // ✅ 生成 UUID
        type: "pick up",
        productID: "null",
        emptyStatus: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("✅ Bins 插入成功！");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("🗑 开始删除 `Bins` 里的测试数据...");
    await queryInterface.bulkDelete("Bins", { warehouseCode: "WHCODE-001" });
    console.log("✅ 删除完成！");
  },
};