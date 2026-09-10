const sequelize = require('./sequelize');

const Ala = require('./ala');
const Habitacion = require('./habitacion');
const Cama = require('./cama');
const ObraSocial = require('./obraSocial');
const Paciente = require('./paciente');
const Admision = require('./admision');
const Especialidad = require('./especialidad');
const Medico = require('./medico');
const Evaluacion = require('./evaluacion');
const Alta = require('./alta');
const Turno = require('./turno');
const Usuario = require('./usuario');
const Consulta = require('./consulta');

Ala.hasMany(Habitacion, { foreignKey: 'id_ala', as: 'habitaciones' });
Habitacion.belongsTo(Ala, { foreignKey: 'id_ala', as: 'ala' });

Habitacion.hasMany(Cama, { foreignKey: 'id_habitacion', as: 'camas' });
Cama.belongsTo(Habitacion, { foreignKey: 'id_habitacion', as: 'habitacion' });

ObraSocial.hasMany(Paciente, { foreignKey: 'id_obra_social', as: 'pacientes' });
Paciente.belongsTo(ObraSocial, { foreignKey: 'id_obra_social', as: 'obraSocial' });

Paciente.hasMany(Admision, { foreignKey: 'id_paciente', as: 'admisiones' });
Admision.belongsTo(Paciente, { foreignKey: 'id_paciente', as: 'paciente' });

Admision.belongsTo(Cama, { foreignKey: 'id_cama_asignada', as: 'cama' });
Cama.hasMany(Admision, { foreignKey: 'id_cama_asignada', as: 'admisiones' });

Especialidad.hasMany(Medico, { foreignKey: 'id_especialidad', as: 'medicos' });
Medico.belongsTo(Especialidad, { foreignKey: 'id_especialidad', as: 'especialidad' });

Admision.hasMany(Evaluacion, { foreignKey: 'id_admision', as: 'evaluaciones' });
Evaluacion.belongsTo(Admision, { foreignKey: 'id_admision', as: 'admision' });

Paciente.hasMany(Evaluacion, { foreignKey: 'id_paciente', as: 'evaluaciones' });
Evaluacion.belongsTo(Paciente, { foreignKey: 'id_paciente', as: 'paciente' });

Medico.hasMany(Evaluacion, { foreignKey: 'id_medico', as: 'evaluaciones' });
Evaluacion.belongsTo(Medico, { foreignKey: 'id_medico', as: 'medico' });

Admision.hasOne(Alta, { foreignKey: 'id_admision', as: 'alta' });
Alta.belongsTo(Admision, { foreignKey: 'id_admision', as: 'admision' });

Medico.hasMany(Alta, { foreignKey: 'id_medico', as: 'altas' });
Alta.belongsTo(Medico, { foreignKey: 'id_medico', as: 'medico' });

Paciente.hasMany(Turno, { foreignKey: 'id_paciente', as: 'turnos' });
Turno.belongsTo(Paciente, { foreignKey: 'id_paciente', as: 'paciente' });

Medico.hasMany(Turno, { foreignKey: 'id_medico', as: 'turnos' });
Turno.belongsTo(Medico, { foreignKey: 'id_medico', as: 'medico' });

Paciente.hasMany(Consulta, { foreignKey: 'id_paciente', as: 'consultas' });
Consulta.belongsTo(Paciente, { foreignKey: 'id_paciente', as: 'paciente' });

module.exports = {
  sequelize,
  Ala,
  Habitacion,
  Cama,
  ObraSocial,
  Paciente,
  Admision,
  Especialidad,
  Medico,
  Evaluacion,
  Alta,
  Turno,
  Usuario,
  Consulta
};