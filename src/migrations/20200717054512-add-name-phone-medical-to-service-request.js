'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

   return Promise.all([
    queryInterface.addColumn(
      'service_requests',
      'patient_name',
      {
        type: Sequelize.STRING
      }
    ),
    queryInterface.addColumn(
      'service_requests',
      'destination_contact',
      {
        type: Sequelize.STRING
      }
    ),
    queryInterface.addColumn(
      'service_requests',
      'medical_info',
      {
        type: Sequelize.TEXT
      }
    ),
  ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('service_requests', 'patient_name'),
      queryInterface.removeColumn('service_requests', 'destination_contact'),
      queryInterface.removeColumn('service_requests', 'medical_info')
    ]);
  }
};
