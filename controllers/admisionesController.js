const { sequelize, Admision, Paciente, Cama, Habitacion, Ala, ObraSocial, Medico, Evaluacion, Alta } = require('../models');
const { Op } = require('sequelize');

exports.listarAdmisiones = async (req, res) => {
    try {
        const buscar = (req.query.buscar || '').toLowerCase().trim();
        const filtro = req.query.filtro || 'activos';

        let admisiones = await Admision.findAll({
            include: [
                {
                    model: Paciente,
                    as: 'paciente',
                    attributes: ['id_paciente', 'nombre', 'apellido', 'dni']
                },
                {
                    model: Cama,
                    as: 'cama',
                    include: [{
                        model: Habitacion,
                        as: 'habitacion',
                        include: [{ model: Ala, as: 'ala' }]
                    }]
                }
            ],
            order: [['fecha_ingreso', 'DESC']]
        });

        if (filtro === 'activos') {
            admisiones = admisiones.filter(a => a.estado_admision !== 'Cancelada' && a.estado_admision !== 'Dada de Alta');
        } else if (filtro === 'cancelados') {
            admisiones = admisiones.filter(a => a.estado_admision === 'Cancelada');
        } else if (filtro === 'alta') {
            admisiones = admisiones.filter(a => a.estado_admision === 'Dada de Alta');
        }

        if (buscar) {
            admisiones = admisiones.filter(a => {
                const dni = (a.paciente && a.paciente.dni) ? a.paciente.dni.toLowerCase() : '';
                const camaNum = (a.cama && a.cama.numero) ? a.cama.numero.toLowerCase() : '';
                const habNum = (a.cama && a.cama.habitacion && a.cama.habitacion.numero) ? a.cama.habitacion.numero.toLowerCase() : '';
                return dni.includes(buscar) || camaNum.includes(buscar) || habNum.includes(buscar);
            });
        }

        res.render('admisiones/index', {
            admisiones,
            title: 'Admisiones',
            buscar: buscar,
            filtro: filtro,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al cargar las admisiones.');
        res.redirect('/');
    }
};

exports.formularioNueva = async (req, res) => {
    try {
        const [pacientes, camasLibres, obrasSociales] = await Promise.all([
            Paciente.findAll({ order: [['apellido', 'ASC']] }),
            Cama.findAll({
                where: { estado: 'Libre' },
                include: [{
                    model: Habitacion,
                    as: 'habitacion',
                    include: [
                        { model: Ala, as: 'ala' },
                        {
                            model: Cama,
                            as: 'camas',
                            include: [{
                                model: Admision,
                                as: 'admisiones',
                                where: { estado_admision: 'Activo' },
                                required: false,
                                include: [{ model: Paciente, as: 'paciente', attributes: ['genero'] }]
                            }]
                        }
                    ]
                }],
                order: [['id_cama', 'ASC']]
            }),
            ObraSocial.findAll({ order: [['nombre', 'ASC']] })
        ]);
        res.render('admisiones/nueva', {
            pacientes,
            camasDisponibles: camasLibres,
            obrasSociales,
            title: 'Nueva Admisión',
            error: req.flash('error')
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al preparar el formulario de admisión.');
        res.redirect('/admisiones');
    }
};

exports.guardarAdmision = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_paciente, tipo_registro, genero_paciente_nuevo, nombre_paciente_nuevo, motivo_internacion, id_cama_asignada, es_emergencia } = req.body;
        let pacienteId = id_paciente;

        if (tipo_registro === 'nuevo' || tipo_registro === 'emergencia') {
            if (!genero_paciente_nuevo) {
                throw new Error('El género es obligatorio para registrar un nuevo paciente.');
            }
            const nuevoPaciente = await Paciente.create({
                nombre: nombre_paciente_nuevo || 'Paciente',
                apellido: es_emergencia === 'on' ? `Emergencia-${Date.now()}` : (req.body.apellido_paciente_nuevo || 'Desconocido'),
                dni: es_emergencia === 'on' ? `EMERG-${Date.now()}` : (req.body.dni_paciente_nuevo || `SIN-DNI-${Date.now()}`),
                fecha_nacimiento: req.body.fecha_nacimiento_nuevo || '1900-01-01',
                genero: genero_paciente_nuevo,
            }, { transaction: t });
            pacienteId = nuevoPaciente.id_paciente;
        }

        if (!pacienteId || !id_cama_asignada || !motivo_internacion) {
            throw new Error('Faltan datos clave: Paciente, Cama o Motivo de internación.');
        }

        const cama = await Cama.findByPk(id_cama_asignada, { transaction: t, lock: t.LOCK.UPDATE });
        if (!cama || cama.estado !== 'Libre') {
            throw new Error('La cama seleccionada ya no se encuentra disponible.');
        }

        const paciente = await Paciente.findByPk(pacienteId, { transaction: t });
        const habitacion = await Habitacion.findByPk(cama.id_habitacion, { transaction: t });

        if (habitacion.tipo === 'Compartida') {
            const camasEnHabitacion = await Cama.findAll({ where: { id_habitacion: habitacion.id_habitacion }, transaction: t });
            const idsCamas = camasEnHabitacion.map(c => c.id_cama);

            const admisionesActivas = await Admision.findAll({
                where: {
                    id_cama_asignada: idsCamas,
                    estado_admision: ['Activo', 'En Proceso']
                },
                include: [{ model: Paciente, as: 'paciente' }],
                transaction: t
            });

            for (const admision of admisionesActivas) {
                if (admision.paciente.genero !== paciente.genero) {
                    throw new Error('No se puede asignar: la habitación compartida está ocupada por un paciente de distinto sexo.');
                }
            }
        }

        await Admision.create({
            id_paciente: pacienteId,
            id_cama_asignada: id_cama_asignada,
            motivo_internacion: motivo_internacion,
            es_emergencia: es_emergencia === 'on',
            fecha_ingreso: new Date(),
            estado_admision: 'Activo'
        }, { transaction: t });

        await cama.update({ estado: 'Ocupada' }, { transaction: t });
        await t.commit();
        req.flash('success', 'Admisión registrada con éxito.');
        res.redirect('/admisiones');
    } catch (error) {
        await t.rollback();
        console.error(error);
        req.flash('error', error.message);
        res.redirect('/admisiones/nueva');
    }
};

exports.verDetalles = async (req, res) => {
    try {
        const admision = await Admision.findByPk(req.params.id_admision, {
            include: [
                { model: Paciente, as: 'paciente', include: [{ model: ObraSocial, as: 'obraSocial' }] },
                {
                    model: Cama,
                    as: 'cama',
                    required: false,
                    include: [{ model: Habitacion, as: 'habitacion', include: [{ model: Ala, as: 'ala' }] }]
                },
                { model: Evaluacion, as: 'evaluaciones', include: [{ model: Medico, as: 'medico' }], order: [['fecha_evaluacion', 'DESC']] },
                { model: Alta, as: 'alta', include: [{ model: Medico, as: 'medico' }] }
            ]
        });
        if (!admision) {
            req.flash('error', 'Admisión no encontrada.');
            return res.redirect('/admisiones');
        }
        res.render('admisiones/detalles', {
            admision,
            title: `Detalles de Admisión #${admision.id_admision}`,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al cargar los detalles de la admisión.');
        res.redirect('/admisiones');
    }
};

exports.formularioEditar = async (req, res) => {
    try {
        const admision = await Admision.findByPk(req.params.id_admision, {
            include: [{ model: Paciente, as: 'paciente' }, { model: Cama, as: 'cama' }]
        });
        if (!admision) {
            req.flash('error', 'Admisión no encontrada.');
            return res.redirect('/admisiones');
        }
        const camasDisponibles = await Cama.findAll({
            where: {
                [Op.or]: [
                    { estado: 'Libre' },
                    { id_cama: admision.id_cama_asignada || null }
                ]
            },
            include: [{ model: Habitacion, as: 'habitacion', include: [{ model: Ala, as: 'ala' }] }]
        });
        res.render('admisiones/editar', {
            title: `Editar Admisión #${admision.id_admision}`,
            admision,
            camasDisponibles,
            error: req.flash('error')
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al preparar el formulario de edición.');
        res.redirect('/admisiones');
    }
};

exports.actualizarAdmision = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_admision } = req.params;
        const { motivo_internacion, id_cama_asignada, estado_admision } = req.body;
        
        const admision = await Admision.findByPk(id_admision, { 
            include: [{ model: Paciente, as: 'paciente' }],
            transaction: t 
        });
        
        if (!admision) {
            throw new Error('Admisión no encontrada.');
        }
        
        const oldCamaId = admision.id_cama_asignada;
        const newCamaId = id_cama_asignada ? parseInt(id_cama_asignada, 10) : oldCamaId;

        if (newCamaId && newCamaId !== oldCamaId) {
            const nuevaCama = await Cama.findByPk(newCamaId, { 
                include: [{ model: Habitacion, as: 'habitacion' }],
                transaction: t, 
                lock: t.LOCK.UPDATE 
            });
            
            if (!nuevaCama || nuevaCama.estado !== 'Libre') {
                throw new Error('La nueva cama seleccionada no está disponible.');
            }

            if (nuevaCama.habitacion.tipo === 'Compartida') {
                const camasEnHabitacion = await Cama.findAll({ where: { id_habitacion: nuevaCama.id_habitacion }, transaction: t });
                const idsCamas = camasEnHabitacion.map(c => c.id_cama);

                const admisionesActivas = await Admision.findAll({
                    where: {
                        id_cama_asignada: idsCamas,
                        estado_admision: ['Activo', 'En Proceso']
                    },
                    include: [{ model: Paciente, as: 'paciente' }],
                    transaction: t
                });

                for (const admActiva of admisionesActivas) {
                    if (admActiva.paciente.genero !== admision.paciente.genero) {
                        throw new Error('No se puede reasignar: la habitación compartida está ocupada por un paciente de distinto sexo.');
                    }
                }
            }

            await nuevaCama.update({ estado: 'Ocupada' }, { transaction: t });
            if (oldCamaId) {
                const oldCama = await Cama.findByPk(oldCamaId, { transaction: t });
                if (oldCama) await oldCama.update({ estado: 'Libre' }, { transaction: t });
            }
        } else if ((estado_admision === 'Dada de Alta' || estado_admision === 'Cancelada') && oldCamaId) {
            const camaALiberar = await Cama.findByPk(oldCamaId, { transaction: t });
            if (camaALiberar) await camaALiberar.update({ estado: 'En Limpieza' }, { transaction: t });
        }

        await admision.update({
            motivo_internacion,
            estado_admision,
            id_cama_asignada: newCamaId,
            fecha_alta: (estado_admision === 'Dada de Alta' || estado_admision === 'Cancelada') ? new Date() : null
        }, { transaction: t });

        await t.commit();
        req.flash('success', 'Admisión actualizada con éxito.');
        res.redirect('/admisiones');
    } catch (error) {
        await t.rollback();
        console.error(error);
        req.flash('error', error.message);
        res.redirect(`/admisiones/editar/${req.params.id_admision}`);
    }
};

exports.cancelarAdmision = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_admision } = req.params;
        const admision = await Admision.findByPk(id_admision, { transaction: t });
        
        if (!admision) {
            throw new Error('Admisión no encontrada.');
        }

        if (admision.estado_admision === 'Dada de Alta' || admision.estado_admision === 'Cancelada') {
            throw new Error('No se puede cancelar una admisión que ya está de alta o fue cancelada previamente.');
        }

        await admision.update({ 
            estado_admision: 'Cancelada', 
            fecha_alta: new Date() 
        }, { transaction: t });

        if (admision.id_cama_asignada) {
            const cama = await Cama.findByPk(admision.id_cama_asignada, { transaction: t });
            if (cama) {
                await cama.update({ estado: 'Libre' }, { transaction: t });
            }
        }

        await t.commit();
        req.flash('success', 'Admisión cancelada y recursos liberados exitosamente.');
        res.redirect('/admisiones');
    } catch (error) {
        await t.rollback();
        console.error(error);
        req.flash('error', error.message || 'No se pudo cancelar la admisión.');
        res.redirect('/admisiones');
    }
};

exports.darAlta = async (req, res) => {
    try {
        const { id_admision } = req.params;
        const admision = await Admision.findByPk(id_admision);
        if (!admision || admision.estado_admision !== 'Activo') {
            req.flash('error', 'No se puede dar de alta una admisión que no esté activa.');
            return res.redirect('/admisiones');
        }
        res.redirect(`/altas/nueva/${id_admision}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al preparar el alta del paciente.');
        res.redirect('/admisiones');
    }
};