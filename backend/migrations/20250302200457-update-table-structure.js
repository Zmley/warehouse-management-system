"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🚀 开始更新数据库表结构...");

    // ✅ 1. 修改 Bins 表的 ID 为 binID
    await queryInterface.renameColumn("Bins", "ID", "binID");

    // ✅ 2. 修改 Inventory 表的 ID 为 inventoryID
    await queryInterface.renameColumn("Inventory", "ID", "inventoryID");

    // ✅ 3. 修改 Tasks 表的 ID 为 taskID
    await queryInterface.renameColumn("Tasks", "ID", "taskID");

    // ✅ 4. 让 assignedUserID 替换 accountID
    await queryInterface.renameColumn("Users", "accountID", "assignedUserID");

    console.log("✅ 数据表更新完成!");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("⏪ 回滚数据库表结构...");

    // 还原表结构
    await queryInterface.renameColumn("Bins", "binID", "ID");
    await queryInterface.renameColumn("Inventory", "inventoryID", "ID");
    await queryInterface.renameColumn("Tasks", "taskID", "ID");
    await queryInterface.renameColumn("Users", "assignedUserID", "accountID");

    console.log("✅ 还原数据库表结构完成!");
  },
};