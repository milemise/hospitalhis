const { Model, DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

class Alta extends Model {}

Alta.init({
    id_alta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_admision: { type: DataTypes.INTEGER, allowNull: false },
    id_medico: { type: DataTypes.INTEGER, allowNull: true },
    tipo_alta: { type: DataTypes.STRING, allowNull: false },
    resumen_epicrisis: { type: DataTypes.TEXT, allowNull: false },
    fecha_alta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'Alta',
    tableName: 'altas',
    timestamps: false
});

module.exports = Alta;