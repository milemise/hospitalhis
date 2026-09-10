const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Acceso denegado. Por favor, inicia sesión.');
    res.redirect('/auth/login');
};

router.use(isAuthenticated);

router.get('/', medicoController.listarMedicos);
router.get('/nuevo', medicoController.formularioNuevo);
router.post('/', medicoController.guardarMedico);
router.get('/editar/:id', medicoController.formularioEditar);
router.post('/actualizar/:id', medicoController.actualizarMedico);
router.post('/eliminar/:id', medicoController.eliminarMedico);

module.exports = router;