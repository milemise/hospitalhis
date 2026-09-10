const { Model, DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

class Medico extends Model {}

Medico.init({
    id_medico: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dni: { type: DataTypes.STRING, allowNull: true, unique: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellido: { type: DataTypes.STRING, allowNull: false },
    fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: true },
    genero: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true, unique: true },
    direccion: { type: DataTypes.STRING, allowNull: true },
    matricula: { type: DataTypes.STRING, allowNull: false },
    id_especialidad: { type: DataTypes.INTEGER, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    sequelize,
    modelName: 'Medico',
    tableName: 'medicos',
    timestamps: false
});

module.exports = Medico;