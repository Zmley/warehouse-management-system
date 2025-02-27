module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Tasks", "sourceBinID", {
      type: Sequelize.STRING,
      allowNull: true,  // ✅ 允许 NULL 值
    });

    await queryInterface.changeColumn("Tasks", "destinationBin", {
      type: Sequelize.STRING,
      allowNull: true,  // ✅ 允许 NULL 值
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Tasks", "sourceBinID", {
      type: Sequelize.STRING,
      allowNull: false,  // 还原回原来的约束
    });

    await queryInterface.changeColumn("Tasks", "destinationBin", {
      type: Sequelize.STRING,
      allowNull: false,  // 还原回原来的约束
    });
  }
};