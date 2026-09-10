const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Habitacion = sequelize.define('Habitacion', {
  id_habitacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_ala: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sexo_asignado: {
    type: DataTypes.STRING(20),
    defaultValue: 'Mixto'
  }
}, {
  tableName: 'habitaciones',
  timestamps: false
});

module.exports = Habitacion;