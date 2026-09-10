const express = require('express');
const router = express.Router();
const camaController = require('../controllers/camaController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Acceso denegado. Por favor, inicia sesión.');
    res.redirect('/auth/login');
};

router.use(isAuthenticated);

router.get('/', camaController.listarCamas);
router.get('/nueva', camaController.formularioNueva);
router.post('/', camaController.guardarCama);
router.post('/habitacion', camaController.guardarHabitacion);
router.post('/ala', camaController.guardarAla);
router.post('/ala/actualizar/:id_ala', camaController.actualizarAla);
router.get('/editar/:id_cama', camaController.formularioEditar);
router.post('/actualizar/:id_cama', camaController.actualizarCama);
router.post('/eliminar/:id_cama', camaController.eliminarCama);
router.post('/actualizar-estado/:id', camaController.actualizarEstadoCama);

module.exports = router;