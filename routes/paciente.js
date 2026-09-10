const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Acceso denegado. Por favor, inicia sesión.');
    res.redirect('/auth/login');
};

router.use(isAuthenticated);

router.get('/', pacienteController.listarPacientes);
router.get('/nuevo', pacienteController.formularioNueva);
router.post('/', pacienteController.guardarPaciente);
router.get('/editar/:id_paciente', pacienteController.formularioEditar);
router.post('/actualizar/:id_paciente', pacienteController.actualizarPaciente);
router.post('/eliminar/:id_paciente', pacienteController.eliminarPaciente);
router.post('/cancelar/:id', pacienteController.cancelarPaciente);
router.get('/buscar-personal', pacienteController.buscarPersonal);

// Rutas Clínicas Centralizadas
router.get('/historia/:id', pacienteController.historiaClinica);
router.post('/historia/:id/consulta', pacienteController.guardarConsulta);
router.post('/historia/:id/medicacion', pacienteController.actualizarMedicacion);

module.exports = router;