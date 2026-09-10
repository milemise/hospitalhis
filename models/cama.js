const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const Cama = sequelize.define('Cama', {
  id_cama: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_habitacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'habitaciones',
      key: 'id_habitacion'
    }
  },
  numero: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(50), // Cambiado a STRING para evitar choques
    allowNull: false,
    defaultValue: 'libre'
  },
  genero_asignado: {
    type: DataTypes.STRING(2), // Cambiado a STRING
    allowNull: true
  }
}, {
  tableName: 'cama',
  timestamps: false
});

Cama.associate = (models) => {
  Cama.belongsTo(models.Habitacion, { foreignKey: 'id_habitacion', as: 'habitacion' });
  Cama.hasMany(models.Admision, { foreignKey: 'id_cama_asignada', as: 'admisiones' });
};

module.exports = Cama;