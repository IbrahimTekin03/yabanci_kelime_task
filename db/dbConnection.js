const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('yabanci_kelime_task', 'root', '', {
  host: '127.0.0.1',
  dialect: 'mysql'
});

sequelize.authenticate()
  .then(() => {
    console.log('Connected to db');
  })
  .catch(err => {
    console.error('Error connecting to db:', err);
  });


sequelize.sync()
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
  });

module.exports = sequelize;