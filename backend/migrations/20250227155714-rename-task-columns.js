"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("Tasks", "assignedUserId", "assignedUserID");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("Tasks", "assignedUserID", "assignedUserId");
  },
};