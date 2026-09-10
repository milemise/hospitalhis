require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida para el entorno de producción.');
  }
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

  if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
    throw new Error('Faltan variables de entorno para la base de datos local (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST).');
  }

  sequelize = new Sequelize({
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    logging: false
  });
}

module.exports = sequelize;