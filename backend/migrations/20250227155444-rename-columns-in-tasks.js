"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ✅ 修改 `completedAt` 为 `updatedAt`
    await queryInterface.renameColumn("Tasks", "completedAt", "updatedAt");

    // ✅ 修改 `sourceBinId` 为 `sourceBinID`
    await queryInterface.renameColumn("Tasks", "sourceBinId", "sourceBinID");
  },

  down: async (queryInterface, Sequelize) => {
    // 还原更改
    await queryInterface.renameColumn("Tasks", "updatedAt", "completedAt");
    await queryInterface.renameColumn("Tasks", "sourceBinID", "sourceBinId");
  }
};