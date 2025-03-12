"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" TYPE TEXT;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_role";
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Users_role" AS ENUM ('ADMIN', 'PICKER', 'TRANSPORT_WORKER', 'SUPER_ADMIN');
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE "Users" 
        SET "role" = 'ADMIN' WHERE "role" = 'admin';
        UPDATE "Users" 
        SET "role" = 'PICKER' WHERE "role" = 'picker';
        UPDATE "Users" 
        SET "role" = 'TRANSPORT_WORKER' WHERE "role" = 'transportWorker';
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "role" TYPE "enum_Users_role" 
        USING "role"::TEXT::"enum_Users_role";
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" ALTER COLUMN "role" TYPE TEXT;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE "enum_Users_role";
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'picker', 'transportWorker');
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE "Users" 
        SET "role" = 'admin' WHERE "role" = 'ADMIN';
        UPDATE "Users" 
        SET "role" = 'picker' WHERE "role" = 'PICKER';
        UPDATE "Users" 
        SET "role" = 'transportWorker' WHERE "role" = 'TRANSPORT_WORKER';
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "Users" 
        ALTER COLUMN "role" TYPE "enum_Users_role" 
        USING "role"::TEXT::"enum_Users_role";
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.log("❌ 回滚失败！");
      throw error;
    }
  }
};