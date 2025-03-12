"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn("Warehouses", "warehouseID_new", {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn("uuid_generate_v4"),
        allowNull: false,
      }, { transaction });

      const warehouses = await queryInterface.sequelize.query(
        `SELECT "warehouseID" FROM "Warehouses";`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      for (const warehouse of warehouses) {
        const oldID = warehouse.warehouseID;
        const newID = uuidv4(); // 生成新的 UUID
        await queryInterface.sequelize.query(
          `UPDATE "Warehouses" SET "warehouseID_new" = :newID WHERE "warehouseID" = :oldID;`,
          { transaction, replacements: { newID, oldID } }
        );
      }

      await queryInterface.removeColumn("Warehouses", "warehouseID", { transaction });

      await queryInterface.renameColumn("Warehouses", "warehouseID_new", "warehouseID", { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE "Warehouses" ADD PRIMARY KEY ("warehouseID");`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn("Warehouses", "warehouseID_old", {
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });

      const warehouses = await queryInterface.sequelize.query(
        `SELECT "warehouseID" FROM "Warehouses";`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      for (const warehouse of warehouses) {
        const oldID = warehouse.warehouseID;
        const newID = oldID.substring(0, 36); // 确保符合字符串格式
        await queryInterface.sequelize.query(
          `UPDATE "Warehouses" SET "warehouseID_old" = :newID WHERE "warehouseID" = :oldID;`,
          { transaction, replacements: { newID, oldID } }
        );
      }

      await queryInterface.removeColumn("Warehouses", "warehouseID", { transaction });

      await queryInterface.renameColumn("Warehouses", "warehouseID_old", "warehouseID", { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE "Warehouses" ADD PRIMARY KEY ("warehouseID");`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};