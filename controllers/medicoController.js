const { Medico, Especialidad } = require('../models');
const { Op } = require('sequelize');

exports.listarMedicos = async (req, res) => {
    try {
        const buscar = (req.query.buscar || '').toLowerCase().trim();
        let medicos = await Medico.findAll({
            include: [{ model: Especialidad, as: 'especialidad' }],
            order: [['apellido', 'ASC']]
        });

        if (buscar) {
            medicos = medicos.filter(m => {
                const nombreCompleto = `${m.nombre || ''} ${m.apellido || ''}`.toLowerCase();
                const matricula = (m.matricula || '').toLowerCase();
                const dni = (m.dni || '').toLowerCase();
                const esp = m.especialidad ? m.especialidad.nombre.toLowerCase() : '';
                return nombreCompleto.includes(buscar) || matricula.includes(buscar) || dni.includes(buscar) || esp.includes(buscar);
            });
        }

        res.render('medicos/index', {
            medicos,
            buscar,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error al listar el plantel médico.');
        res.redirect('/');
    }
};

exports.formularioNuevo = async (req, res) => {
    try {
        const especialidades = await Especialidad.findAll({ order: [['nombre', 'ASC']] });
        res.render('medicos/nuevo', {
            especialidades,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error al preparar el formulario.');
        res.redirect('/medicos');
    }
};

exports.guardarMedico = async (req, res) => {
    try {
        const { dni, nombre, apellido, fecha_nacimiento, genero, telefono, email, direccion, matricula, id_especialidad } = req.body;

        if (!nombre || !apellido || !matricula) {
            throw new Error('Faltan campos obligatorios (Nombre, Apellido, Matrícula).');
        }

        await Medico.create({
            dni: dni || null,
            nombre,
            apellido,
            fecha_nacimiento: fecha_nacimiento || null,
            genero: genero || null,
            telefono: telefono || null,
            email: email || null,
            direccion: direccion || null,
            matricula,
            id_especialidad: id_especialidad || null,
            activo: true
        });

        req.flash('success', 'Médico registrado con éxito en la base de datos.');
        res.redirect('/medicos');
    } catch (error) {
        req.flash('error', 'Error al guardar el médico: ' + error.message);
        res.redirect('/medicos/nuevo');
    }
};

exports.formularioEditar = async (req, res) => {
    try {
        const medico = await Medico.findByPk(req.params.id);
        if (!medico) {
            req.flash('error', 'Médico no encontrado.');
            return res.redirect('/medicos');
        }
        const especialidades = await Especialidad.findAll({ order: [['nombre', 'ASC']] });
        res.render('medicos/editar', {
            medico,
            especialidades,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error al cargar el médico para editar.');
        res.redirect('/medicos');
    }
};

exports.actualizarMedico = async (req, res) => {
    try {
        const { id } = req.params;
        const { dni, nombre, apellido, fecha_nacimiento, genero, telefono, email, direccion, matricula, id_especialidad, activo } = req.body;

        const medico = await Medico.findByPk(id);
        if (!medico) {
            throw new Error('Médico no encontrado.');
        }

        await medico.update({
            dni: dni || null,
            nombre,
            apellido,
            fecha_nacimiento: fecha_nacimiento || null,
            genero: genero || null,
            telefono: telefono || null,
            email: email || null,
            direccion: direccion || null,
            matricula,
            id_especialidad: id_especialidad || null,
            activo: activo === 'on'
        });

        req.flash('success', 'Datos del médico actualizados con éxito.');
        res.redirect('/medicos');
    } catch (error) {
        req.flash('error', 'Error al actualizar: ' + error.message);
        res.redirect('/medicos/editar/' + req.params.id);
    }
};

exports.eliminarMedico = async (req, res) => {
    try {
        const medico = await Medico.findByPk(req.params.id);
        if (medico) {
            medico.activo = !medico.activo;
            await medico.save();
            req.flash('success', 'Estado del médico actualizado.');
        }
        res.redirect('/medicos');
    } catch (error) {
        req.flash('error', 'No se pudo cambiar el estado del médico.');
        res.redirect('/medicos');
    }
};