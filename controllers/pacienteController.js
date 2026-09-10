const { Paciente, ObraSocial, Admision, Cama, Habitacion, Ala, Usuario, Medico, Evaluacion, Alta, Consulta } = require('../models');
const { Op } = require('sequelize');

exports.listarPacientes = async (req, res) => {
    try {
        const buscar = (req.query.buscar || '').toLowerCase().trim();
        const filtro = req.query.filtro || 'activos';

        let pacientes = await Paciente.findAll({
            include: [
                { model: ObraSocial, as: 'obraSocial' },
                {
                    model: Admision,
                    as: 'admisiones',
                    where: { estado_admision: 'En Proceso' },
                    required: false,
                    limit: 1,
                    order: [['fecha_ingreso', 'DESC']],
                    include: [{ model: Cama, as: 'cama', include: [{ model: Habitacion, as: 'habitacion' }] }]
                }
            ],
            order: [['apellido', 'ASC'], ['nombre', 'ASC']]
        });

        if (filtro === 'activos') pacientes = pacientes.filter(p => p.activo !== false);
        else if (filtro === 'inactivos') pacientes = pacientes.filter(p => p.activo === false);

        if (buscar) {
            pacientes = pacientes.filter(p => {
                const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
                const dni = (p.dni || '').toLowerCase();
                return nombreCompleto.includes(buscar) || dni.includes(buscar);
            });
        }

        res.render('pacientes/index', {
            pacientes, buscar, filtro,
            success: req.flash('success'), error: req.flash('error')
        });
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
        req.flash('error', 'Error al cargar pacientes.');
        res.redirect('/');
    }
};

exports.formularioNueva = async (req, res) => {
    try {
        const obrasSociales = await ObraSocial.findAll();
        res.render('pacientes/nuevo', { obrasSociales, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        req.flash('error', 'Error al preparar el formulario.');
        res.redirect('/pacientes');
    }
};

exports.buscarPersonal = async (req, res) => {
    try {
        const termino = (req.query.termino || '').trim();
        if (!termino) return res.json({ encontrado: false });

        const partes = termino.split(/\s+/).filter(Boolean);
        
        let whereConds = [
            { email: { [Op.iLike]: `%${termino}%` } },
            { dni: { [Op.iLike]: `%${termino}%` } },
            { matricula: { [Op.iLike]: `%${termino}%` } },
            { nombre: { [Op.iLike]: `%${termino}%` } },
            { apellido: { [Op.iLike]: `%${termino}%` } }
        ];

        // Si escriben nombre y apellido separados por espacio (ej: "Juan Pérez")
        if (partes.length > 1) {
            whereConds.push({
                [Op.and]: [
                    { nombre: { [Op.iLike]: `%${partes[0]}%` } },
                    { apellido: { [Op.iLike]: `%${partes[partes.length - 1]}%` } }
                ]
            });
        }

        let medico = await Medico.findOne({
            where: { [Op.or]: whereConds }
        });

        if (medico) {
            let fechaFmt = '';
            if (medico.fecha_nacimiento) {
                fechaFmt = typeof medico.fecha_nacimiento.toISOString === 'function' 
                    ? medico.fecha_nacimiento.toISOString().split('T')[0] 
                    : String(medico.fecha_nacimiento).split('T')[0];
            }

            return res.json({ 
                encontrado: true, 
                datos: { 
                    dni: medico.dni || '',
                    nombre: medico.nombre, 
                    apellido: medico.apellido, 
                    email: medico.email || '', 
                    telefono: medico.telefono || '',
                    fecha_nacimiento: fechaFmt,
                    genero: medico.genero || '',
                    direccion: medico.direccion || ''
                } 
            });
        }

        let usuario = await Usuario.findOne({
            where: { 
                [Op.or]: [
                    { email: { [Op.iLike]: `%${termino}%` } }, 
                    { nombre_usuario: { [Op.iLike]: `%${termino}%` } }
                ] 
            }
        });

        if (usuario) {
            let partesUsr = (usuario.nombre_usuario || '').split(' ');
            return res.json({ 
                encontrado: true, 
                datos: { 
                    dni: '',
                    nombre: partesUsr[0] || '', 
                    apellido: partesUsr.slice(1).join(' ') || '', 
                    email: usuario.email, 
                    telefono: '',
                    fecha_nacimiento: '',
                    genero: '',
                    direccion: ''
                } 
            });
        }

        res.json({ encontrado: false });
    } catch (error) {
        console.error('Error en buscarPersonal:', error);
        res.status(500).json({ encontrado: false });
    }
};

exports.guardarPaciente = async (req, res) => {
    try {
        const { nombre, apellido, dni, fecha_nacimiento, genero, telefono, email, direccion, id_obra_social, numero_afiliado } = req.body;
        if (!nombre || !apellido || !dni || !fecha_nacimiento || !genero) throw new Error('Faltan campos obligatorios.');

        await Paciente.create({
            nombre, apellido, dni, fecha_nacimiento, genero, telefono, email, direccion,
            id_obra_social: id_obra_social || null, numero_afiliado, activo: true, estado: 'Activo'
        });
        req.flash('success', 'Paciente creado con éxito.');
        res.redirect('/pacientes');
    } catch (error) {
        let errMsg = error.name === 'SequelizeUniqueConstraintError' ? `Ya existe el DNI ${req.body.dni}.` : 'Error al crear paciente.';
        req.flash('error', errMsg);
        res.redirect('/pacientes/nuevo');
    }
};

exports.formularioEditar = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id_paciente, { include: [{ model: ObraSocial, as: 'obraSocial' }] });
        if (!paciente) return res.redirect('/pacientes');
        const obrasSociales = await ObraSocial.findAll();
        res.render('pacientes/editar', { paciente, obrasSociales, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        res.redirect('/pacientes');
    }
};

exports.actualizarPaciente = async (req, res) => {
    try {
        const { id_paciente } = req.params;
        const { nombre, apellido, dni, fecha_nacimiento, genero, telefono, email, direccion, id_obra_social, numero_afiliado, activo } = req.body;
        const paciente = await Paciente.findByPk(id_paciente);
        
        await paciente.update({
            nombre, apellido, dni, fecha_nacimiento, genero, telefono, email, direccion,
            id_obra_social: id_obra_social || null, numero_afiliado, activo: activo === 'on' 
        });
        req.flash('success', 'Datos demográficos actualizados.');
        res.redirect('/pacientes');
    } catch (error) {
        req.flash('error', 'Error al actualizar el paciente.');
        res.redirect(`/pacientes/editar/${req.params.id_paciente}`);
    }
};

exports.cancelarPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id);
        paciente.activo = !paciente.activo;
        await paciente.save();
        req.flash('success', 'Estado actualizado.');
        res.redirect('/pacientes');
    } catch (error) {
        res.redirect('/pacientes');
    }
};

exports.eliminarPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id_paciente);
        await paciente.destroy();
        req.flash('success', 'Paciente eliminado.');
        res.redirect('/pacientes');
    } catch (error) {
        req.flash('error', 'No se pudo eliminar el paciente.');
        res.redirect('/pacientes');
    }
};

exports.historiaClinica = async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id, {
            include: [
                { model: ObraSocial, as: 'obraSocial' },
                {
                    model: Admision,
                    as: 'admisiones',
                    include: [
                        { model: Evaluacion, as: 'evaluaciones', include: [{ model: Medico, as: 'medico' }] },
                        { model: Alta, as: 'alta', include: [{ model: Medico, as: 'medico' }] },
                        { model: Cama, as: 'cama', include: [{ model: Habitacion, as: 'habitacion', include: [{ model: Ala, as: 'ala' }] }] }
                    ]
                }
            ]
        });

        if (!paciente) {
            req.flash('error', 'Paciente no encontrado.');
            return res.redirect('/pacientes');
        }

        if (paciente.admisiones) {
            paciente.admisiones.sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso));
        }

        let consultas = [];
        try {
            if (Consulta) {
                consultas = await Consulta.findAll({
                    where: { id_paciente: req.params.id },
                    order: [['fecha', 'DESC']]
                });
            }
        } catch (err) {
            console.error('Aviso al buscar consultas ambulatorias:', err.message);
        }

        res.render('pacientes/historia', {
            paciente,
            consultas,
            title: `Historia Clínica - ${paciente.nombre} ${paciente.apellido}`,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('ERROR CRÍTICO AL ABRIR HISTORIA CLÍNICA:', error);
        req.flash('error', 'Error al cargar la historia clínica: ' + error.message);
        res.redirect('/pacientes');
    }
};

exports.guardarConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, motivo, observaciones, receta } = req.body;
        const profesional = req.user ? (req.user.nombre_usuario || req.user.email) : 'Profesional Médico';

        if (!Consulta) {
            throw new Error("El modelo Consulta no está registrado correctamente en models/index.js");
        }

        await Consulta.create({
            id_paciente: id,
            profesional,
            tipo,
            motivo,
            observaciones,
            receta: receta || null,
            fecha: new Date()
        });

        req.flash('success', 'Registro clínico guardado con éxito.');
        res.redirect('/pacientes/historia/' + id);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al guardar registro: ' + error.message);
        res.redirect('/pacientes/historia/' + req.params.id);
    }
};

exports.actualizarMedicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { grupo_sanguineo, alergias, medicamentos_actuales } = req.body;
        
        const paciente = await Paciente.findByPk(id);
        if(paciente) {
            await paciente.update({ grupo_sanguineo, alergias, medicamentos_actuales });
            req.flash('success', 'Información clínica actualizada.');
        }
        res.redirect('/pacientes/historia/' + id);
    } catch (error) {
        req.flash('error', 'Error al actualizar información: ' + error.message);
        res.redirect('/pacientes/historia/' + req.params.id);
    }
};