const { Cama, Habitacion, Ala, Admision, Paciente, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.listarCamas = async (req, res) => {
    try {
        const { buscar } = req.query;
        let alas = await Ala.findAll({
            include: [{
                model: Habitacion,
                as: 'habitaciones',
                include: [{ model: Cama, as: 'camas' }]
            }]
        });

        if (buscar) {
            const b = buscar.toLowerCase();
            alas = alas.map(ala => {
                const alaMatch = ala.nombre.toLowerCase().includes(b);
                const habsFiltradas = ala.habitaciones.map(hab => {
                    const habMatch = hab.numero.toLowerCase().includes(b);
                    const camasFiltradas = hab.camas.filter(c => c.numero.toLowerCase().includes(b) || habMatch || alaMatch);
                    return { ...hab.get({ plain: true }), camas: camasFiltradas };
                }).filter(hab => hab.camas.length > 0 || hab.numero.toLowerCase().includes(b) || alaMatch);
                return { ...ala.get({ plain: true }), habitaciones: habsFiltradas };
            }).filter(ala => ala.habitaciones.length > 0 || ala.nombre.toLowerCase().includes(b));
        }

        const alasParaSelect = await Ala.findAll();

        res.render('camas/index', { 
            alas: buscar ? alas : alas.map(a => a.get({plain:true})), 
            alasDisponibles: alasParaSelect,
            buscar: buscar || '',
            success: req.flash('success'), 
            error: req.flash('error') 
        });
    } catch (error) {
        console.error('🔴 ERROR AL LISTAR CAMAS:', error);
        req.flash('error', 'Error al cargar las camas.');
        res.redirect('/');
    }
};

exports.formularioNueva = async (req, res) => {
    try {
        const habitaciones = await Habitacion.findAll({
            include: [{ model: Ala, as: 'ala' }],
            order: [['numero', 'ASC']]
        });
        res.render('camas/nueva', { 
            habitaciones: habitaciones, 
            success: req.flash('success'),
            error: req.flash('error') 
        });
    } catch (error) {
        console.error('🔴 ERROR AL CARGAR FORMULARIO CAMAS:', error);
        req.flash('error', 'Error al cargar el formulario.');
        res.redirect('/camas');
    }
};

exports.guardarCama = async (req, res) => {
    try {
        console.log("📨 Datos recibidos para Cama:", req.body);
        const { id_habitacion, numero, estado } = req.body;
        
        await Cama.create({ 
            id_habitacion, 
            numero, 
            estado,
            genero_asignado: null 
        });
        
        req.flash('success', 'Cama agregada exitosamente.');
        res.redirect('/camas');
    } catch (error) {
        console.error('🔴 ERROR CRÍTICO AL GUARDAR CAMA:', error);
        const errorMsg = error.parent ? error.parent.message : error.message;
        req.flash('error', 'Fallo en la BD al crear Cama: ' + errorMsg);
        res.redirect('/camas/nueva');
    }
};

exports.guardarHabitacion = async (req, res) => {
    try {
        console.log("📨 Datos recibidos para Habitación:", req.body);
        const { numero, tipo, id_ala } = req.body;
        
        await Habitacion.create({ numero, tipo, id_ala });
        
        req.flash('success', 'Nueva habitación creada con éxito.');
        res.redirect('/camas');
    } catch (error) {
        console.error('🔴 ERROR CRÍTICO AL GUARDAR HABITACIÓN:', error);
        const errorMsg = error.parent ? error.parent.message : error.message;
        req.flash('error', 'Fallo en la BD al crear habitación: ' + errorMsg);
        res.redirect('/camas');
    }
};

exports.guardarAla = async (req, res) => {
    try {
        console.log("📨 Datos recibidos para Ala:", req.body);
        const { nombre } = req.body;
        
        if (!nombre) throw new Error('El nombre del Ala es obligatorio.');
        
        await Ala.create({ nombre });
        
        req.flash('success', 'Nueva Ala creada con éxito.');
        res.redirect('/camas');
    } catch (error) {
        console.error('🔴 ERROR CRÍTICO AL GUARDAR ALA:', error);
        const errorMsg = error.parent ? error.parent.message : error.message;
        req.flash('error', 'Fallo en la BD al crear Ala: ' + errorMsg);
        res.redirect('/camas');
    }
};

exports.actualizarAla = async (req, res) => {
    try {
        const { id_ala } = req.params;
        const { nombre } = req.body;
        const ala = await Ala.findByPk(id_ala);
        
        if (!ala) throw new Error('Ala no encontrada.');
        if (!nombre) throw new Error('El nombre no puede estar vacío.');
        
        await ala.update({ nombre });
        req.flash('success', 'Nombre del Ala actualizado correctamente.');
        res.redirect('/camas');
    } catch (error) {
        console.error('🔴 ERROR CRÍTICO AL ACTUALIZAR ALA:', error);
        const errorMsg = error.parent ? error.parent.message : error.message;
        req.flash('error', 'Fallo en la BD al actualizar Ala: ' + errorMsg);
        res.redirect('/camas');
    }
};

exports.formularioEditar = async (req, res) => {
    try {
        const cama = await Cama.findByPk(req.params.id_cama, {
            include: [{ model: Habitacion, as: 'habitacion', include: [{ model: Ala, as: 'ala' }] }]
        });
        if (!cama) {
            req.flash('error', 'Cama no encontrada.');
            return res.redirect('/camas');
        }
        const habitaciones = await Habitacion.findAll({
            include: [{ model: Ala, as: 'ala' }]
        });
        res.render('camas/editar', {
            cama: cama,
            habitaciones: habitaciones,
            title: `Editar Cama #${cama.numero}`,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error al preparar la edición.');
        res.redirect('/camas');
    }
};

exports.actualizarCama = async (req, res) => {
    try {
        const { id_cama } = req.params;
        const { id_habitacion, numero, estado } = req.body;

        if (!id_habitacion || !numero || !estado) {
            throw new Error('Faltan campos obligatorios para la cama.');
        }

        const cama = await Cama.findByPk(id_cama);
        if (!cama) {
            throw new Error('Cama no encontrada.');
        }
        
        await cama.update({
            id_habitacion,
            numero,
            estado,
            genero_asignado: null
        });
        req.flash('success', 'Cama actualizada con éxito.');
        res.redirect('/camas');
    } catch (error) {
        console.error('🔴 ERROR CRÍTICO AL ACTUALIZAR CAMA:', error);
        const errorMsg = error.parent ? error.parent.message : error.message;
        req.flash('error', errorMsg);
        res.redirect(`/camas/editar/${req.params.id_cama}`);
    }
};

exports.eliminarCama = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_cama } = req.params;
        const cama = await Cama.findByPk(id_cama, { transaction: t });
        if (!cama) {
            throw new Error('Cama no encontrada.');
        }

        const admisionActiva = await Admision.count({
            where: {
                id_cama_asignada: id_cama,
                estado_admision: 'Activo'
            },
            transaction: t
        });

        if (admisionActiva > 0) {
            throw new Error('No se puede eliminar la cama porque está asignada a una admisión.');
        }
        
        await cama.destroy({ transaction: t });
        await t.commit();
        req.flash('success', 'Cama eliminada con éxito.');
        res.redirect('/camas');
    } catch (error) {
        await t.rollback();
        console.error('🔴 ERROR CRÍTICO AL ELIMINAR CAMA:', error);
        const errorMsg = error.parent ? error.parent.message : error.message;
        req.flash('error', errorMsg);
        res.redirect('/camas');
    }
};

exports.actualizarEstadoCama = async (req, res) => {
    try {
        const { Cama } = require('../models');
        const { id } = req.params;
        const { estado } = req.body;

        const cama = await Cama.findByPk(id);
        if (!cama) {
            req.flash('error', 'Cama no encontrada.');
            return res.redirect('/camas');
        }

        if (cama.estado === 'Ocupada' && estado !== 'Ocupada') {
            req.flash('error', 'No puedes cambiar el estado de una cama Ocupada desde aquí. Debes dar de alta o trasladar al paciente en el módulo de Admisiones.');
            return res.redirect('/camas');
        }

        cama.estado = estado;
        await cama.save();

        req.flash('success', `La cama ${cama.numero} ahora está ${estado}.`);
        res.redirect('/camas');
    } catch (error) {
        console.error('Error al actualizar estado de la cama:', error);
        req.flash('error', 'Ocurrió un error al actualizar la cama.');
        res.redirect('/camas');
    }
};