"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("🚀 1. 先把 role 变成 TEXT，解除 ENUM 依赖...");
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" TYPE TEXT;
      `, { transaction });

      console.log("🗑 2. 删除旧 ENUM...");
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_role";
      `, { transaction });

      console.log("🛠 3. 创建新的 ENUM，包含 SUPER_ADMIN...");
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Users_role" AS ENUM ('ADMIN', 'PICKER', 'TRANSPORT_WORKER', 'SUPER_ADMIN');
      `, { transaction });

      console.log("🔄 4. 更新 role 数据...");
      await queryInterface.sequelize.query(`
        UPDATE "Users" 
        SET "role" = 'ADMIN' WHERE "role" = 'admin';
        UPDATE "Users" 
        SET "role" = 'PICKER' WHERE "role" = 'picker';
        UPDATE "Users" 
        SET "role" = 'TRANSPORT_WORKER' WHERE "role" = 'transportWorker';
      `, { transaction });

      console.log("🔄 5. 把 role 重新变回 ENUM 类型...");
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "role" TYPE "enum_Users_role" 
        USING "role"::TEXT::"enum_Users_role";
      `, { transaction });

      await transaction.commit();
      console.log("✅ 迁移完成！");
    } catch (error) {
      await transaction.rollback();
      console.log("❌ 迁移失败，进行回滚！");
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("🚀 1. 先把 role 变成 TEXT，解除 ENUM 依赖...");
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" TYPE TEXT;
      `, { transaction });

      console.log("🗑 2. 删除新的 ENUM...");
      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_role";
      `, { transaction });

      console.log("🛠 3. 重新创建旧 ENUM...");
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'picker', 'transportWorker');
      `, { transaction });

      console.log("🔄 4. 还原 role 数据...");
      await queryInterface.sequelize.query(`
        UPDATE "Users" 
        SET "role" = 'admin' WHERE "role" = 'ADMIN';
        UPDATE "Users" 
        SET "role" = 'picker' WHERE "role" = 'PICKER';
        UPDATE "Users" 
        SET "role" = 'transportWorker' WHERE "role" = 'TRANSPORT_WORKER';
      `, { transaction });

      console.log("🔄 5. 把 role 重新变回旧 ENUM...");
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "role" TYPE "enum_Users_role" 
        USING "role"::TEXT::"enum_Users_role";
      `, { transaction });

      await transaction.commit();
      console.log("✅ 回滚完成！");
    } catch (error) {
      await transaction.rollback();
      console.log("❌ 回滚失败！");
      throw error;
    }
  }
};