const { Evaluacion, Admision, Paciente, Medico } = require('../models');

exports.listarEvaluaciones = async (req, res) => {
    try {
        const evaluaciones = await Evaluacion.findAll({
            include: [
                { model: Admision, as: 'admision', include: [{ model: Paciente, as: 'paciente' }] },
                { model: Medico, as: 'medico' }
            ],
            order: [['fecha_evaluacion', 'DESC']]
        });
        res.render('evaluaciones/index', {
            evaluaciones: evaluaciones,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error al cargar las evaluaciones.');
        res.redirect('/');
    }
};

exports.formularioNueva = async (req, res) => {
    try {
        const { id_admision } = req.params; 

        const admision = await Admision.findByPk(id_admision, {
            include: [{ model: Paciente, as: 'paciente' }]
        });

        if (!admision) {
            req.flash('error', 'Admisión no encontrada para registrar evaluación.');
            return res.redirect('/admisiones');
        }

        const medicos = await Medico.findAll({ order: [['apellido', 'ASC']] });

        res.render('evaluaciones/nueva', { 
            admision: admision,
            medicos: medicos,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Error al preparar el formulario de evaluación.');
        res.redirect('/admisiones');
    }
};

exports.guardarEvaluacion = async (req, res) => {
    try {
        const { id_admision } = req.params;
        const {
            id_medico,
            tipo_evaluacion,
            diagnostico,
            observaciones_medicas,
            observaciones,
            plan_cuidados,
            temperatura,
            presion_arterial,
            frecuencia_cardiaca,
            frecuencia_respiratoria,
            saturacion_oxigeno,
            signos_vitales_pa,
            signos_vitales_fc,
            signos_vitales_fr,
            signos_vitales_temp
        } = req.body;

        const admision = await Admision.findByPk(id_admision);
        if (!admision) {
            throw new Error('Admisión no encontrada.');
        }

        const signosVitales = {};
        if (presion_arterial || signos_vitales_pa) signosVitales.presion_arterial = presion_arterial || signos_vitales_pa;
        if (frecuencia_cardiaca || signos_vitales_fc) signosVitales.frecuencia_cardiaca = frecuencia_cardiaca || signos_vitales_fc;
        if (frecuencia_respiratoria || signos_vitales_fr) signosVitales.frecuencia_respiratoria = frecuencia_respiratoria || signos_vitales_fr;
        if (temperatura || signos_vitales_temp) signosVitales.temperatura = temperatura || signos_vitales_temp;
        if (saturacion_oxigeno) signosVitales.saturacion_oxigeno = saturacion_oxigeno;

        let notasDefinitivas = observaciones || observaciones_medicas || null;
        if (tipo_evaluacion && notasDefinitivas) {
            notasDefinitivas = `[${tipo_evaluacion}] ${notasDefinitivas}`;
        }

        await Evaluacion.create({
            id_admision: id_admision,
            id_paciente: admision.id_paciente, 
            id_medico: id_medico || null,
            diagnostico: diagnostico || null, 
            observaciones_medicas: notasDefinitivas,
            signos_vitales: Object.keys(signosVitales).length > 0 ? signosVitales : null, 
            plan_cuidados: plan_cuidados || null,
            fecha_evaluacion: new Date()
        });

        req.flash('success', 'Evaluación registrada con éxito.');
        res.redirect(`/admisiones/detalles/${id_admision}`); 
    } catch (error) {
        req.flash('error', `Error al registrar la evaluación: ${error.message}`);
        res.redirect(`/evaluaciones/nueva/${req.params.id_admision}`);
    }
};