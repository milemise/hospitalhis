const { Alta, Admision, Paciente, Medico, Cama, sequelize } = require('../models');

exports.formularioNueva = async (req, res) => {
    try {
        const admision = await Admision.findByPk(req.params.id_admision, {
            include: [{ model: Paciente, as: 'paciente' }]
        });
        
        if (!admision || (admision.estado_admision !== 'Activo' && admision.estado_admision !== 'En Proceso')) {
            req.flash('error', 'La admisión no es válida para dar de alta.');
            return res.redirect('/admisiones');
        }

        const medicos = await Medico.findAll({ order: [['apellido', 'ASC']] });

        res.render('altas/nueva', {
            admision,
            medicos
        });
    } catch (error) {
        req.flash('error', 'Error al preparar el alta: ' + error.message);
        res.redirect('/admisiones');
    }
};

exports.guardarAlta = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_admision } = req.params;
        const { id_medico, tipo_alta, resumen_epicrisis } = req.body;

        if (!resumen_epicrisis || !tipo_alta) {
            throw new Error('La epicrisis y el tipo de alta son obligatorios.');
        }

        const admision = await Admision.findByPk(id_admision, { transaction: t });
        
        if (!admision) {
            throw new Error('Admisión no encontrada.');
        }

        const fechaActual = new Date();

        await Alta.create({
            id_admision,
            id_medico: id_medico || null,
            tipo_alta,
            resumen_epicrisis,
            diagnostico_final: resumen_epicrisis,
            tratamiento_indicado: resumen_epicrisis,
            medicamentos_recetados: 'Indicados en epicrisis',
            fecha_alta: fechaActual,
            fecha_alta_real: fechaActual
        }, { transaction: t });

        await admision.update({
            estado_admision: 'Dada de Alta',
            fecha_alta: fechaActual
        }, { transaction: t });

        if (admision.id_cama_asignada) {
            const cama = await Cama.findByPk(admision.id_cama_asignada, { transaction: t });
            if (cama) {
                await cama.update({ estado: 'En Limpieza' }, { transaction: t });
            }
        }

        await t.commit();
        req.flash('success', 'Paciente dado de alta exitosamente. La cama pasó a limpieza.');
        res.redirect('/admisiones/detalles/' + id_admision);
    } catch (error) {
        await t.rollback();
        req.flash('error', 'Error al procesar el alta: ' + error.message);
        res.redirect('/altas/nueva/' + req.params.id_admision);
    }
};