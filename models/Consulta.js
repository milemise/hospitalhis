const { Model, DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

class Consulta extends Model {}

Consulta.init({
    id_consulta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_paciente: { type: DataTypes.INTEGER, allowNull: false },
    profesional: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false }, 
    motivo: { type: DataTypes.STRING, allowNull: false },
    observaciones: { type: DataTypes.TEXT, allowNull: false },
    receta: { type: DataTypes.TEXT, allowNull: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Consulta',
    tableName: 'consultas',
    timestamps: false
});

module.exports = Consulta;