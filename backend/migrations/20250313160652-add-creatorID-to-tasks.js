module.exports = {
  up: async (queryInterface, Sequelize) => {
    // **✅ 第一步：先允许 NULL**
    await queryInterface.addColumn("Tasks", "creatorID", {
      type: Sequelize.STRING,
      allowNull: true, // ✅ 先允许 NULL，避免报错
      references: {
        model: "Users",
        key: "accountID",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // **✅ 第二步：填充已有数据（设置默认创建者）**
    const [results] = await queryInterface.sequelize.query(`
      UPDATE "Tasks"
      SET "creatorID" = (SELECT "accountID" FROM "Users" ORDER BY "createdAt" LIMIT 1)
      WHERE "creatorID" IS NULL;
    `);

    console.log(`✅ Updated ${results.rowCount} existing Tasks with creatorID`);

    // **✅ 第三步：改为 NOT NULL**
    await queryInterface.changeColumn("Tasks", "creatorID", {
      type: Sequelize.STRING,
      allowNull: false, // ✅ 现在可以安全地设置 NOT NULL
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Tasks", "creatorID");
  },
};