const { Turno, Paciente, Medico } = require('../models');

exports.listarTurnos = async (req, res) => {
    try {
        const buscar = (req.query.buscar || '').toLowerCase().trim();

        let turnos = await Turno.findAll({
            include: [
                { model: Paciente, as: 'paciente' },
                { model: Medico, as: 'medico' }
            ],
            order: [['fecha_hora', 'ASC']]
        });

        if (buscar) {
            turnos = turnos.filter(t => {
                const p = t.paciente || {};
                const m = t.medico || {};
                const pacienteStr = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
                const medicoStr = `${m.nombre || ''} ${m.apellido || ''}`.toLowerCase();
                
                return pacienteStr.includes(buscar) || medicoStr.includes(buscar);
            });
        }

        res.render('turnos/index', {
            turnos: turnos,
            buscar: buscar,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error al listar turnos:', error);
        req.flash('error', 'Error al cargar el listado de turnos.');
        res.redirect('/');
    }
};

exports.formularioNueva = async (req, res) => {
    try {
        const pacientes = await Paciente.findAll({ attributes: ['id_paciente', 'nombre', 'apellido', 'dni'] });
        const medicos = await Medico.findAll({ attributes: ['id_medico', 'nombre', 'apellido'] });
        res.render('turnos/nuevo', {
            pacientes: pacientes,
            medicos: medicos,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error al cargar formulario de nuevo turno:', error);
        req.flash('error', 'Error al preparar el formulario de turno.');
        res.redirect('/turnos');
    }
};

exports.guardarTurno = async (req, res) => {
    try {
        const { id_paciente, id_medico, fecha_hora, estado } = req.body;
        if (!id_paciente || !id_medico || !fecha_hora || !estado) {
            throw new Error('Faltan campos obligatorios para el turno.');
        }
        await Turno.create({ id_paciente, id_medico, fecha_hora, estado });
        req.flash('success', 'Turno creado con éxito.');
        res.redirect('/turnos');
    } catch (error) {
        console.error('Error al guardar turno:', error);
        req.flash('error', `Error al crear el turno: ${error.message}`);
        res.redirect('/turnos/nuevo');
    }
};

exports.formularioEditar = async (req, res) => {
    try {
        const turno = await Turno.findByPk(req.params.id, {
            include: [{ model: Paciente, as: 'paciente' }, { model: Medico, as: 'medico' }]
        });
        if (!turno) {
            req.flash('error', 'Turno no encontrado.');
            return res.redirect('/turnos');
        }
        const pacientes = await Paciente.findAll({ attributes: ['id_paciente', 'nombre', 'apellido', 'dni'] });
        const medicos = await Medico.findAll({ attributes: ['id_medico', 'nombre', 'apellido'] });
        res.render('turnos/editar', {
            turno: turno,
            pacientes: pacientes,
            medicos: medicos,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error al cargar formulario de edición de turno:', error);
        req.flash('error', 'Error al preparar el formulario de edición de turno.');
        res.redirect('/turnos');
    }
};

exports.actualizarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_paciente, id_medico, fecha_hora, estado } = req.body;
        if (!id_paciente || !id_medico || !fecha_hora || !estado) {
            throw new Error('Faltan campos obligatorios para el turno.');
        }
        const turno = await Turno.findByPk(id);
        if (!turno) {
            throw new Error('Turno no encontrado.');
        }
        await turno.update({ id_paciente, id_medico, fecha_hora, estado });
        req.flash('success', 'Turno actualizado con éxito.');
        res.redirect('/turnos');
    } catch (error) {
        console.error('Error al actualizar turno:', error);
        req.flash('error', `Error al actualizar el turno: ${error.message}`);
        res.redirect(`/turnos/editar/${req.params.id}`);
    }
};

exports.eliminarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const turno = await Turno.findByPk(id);
        if (!turno) {
            throw new Error('Turno no encontrado.');
        }
        await turno.destroy();
        req.flash('success', 'Turno eliminado con éxito.');
        res.redirect('/turnos');
    } catch (error) {
        console.error('Error al eliminar turno:', error);
        req.flash('error', `Error al eliminar el turno: ${error.message}`);
        res.redirect('/turnos');
    }
};