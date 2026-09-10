const express = require('express');
const router = express.Router();
const evaluacionesController = require('../controllers/evaluacionController'); 

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Acceso denegado. Por favor, inicia sesión.');
    res.redirect('/auth/login');
};

const isAuthorizedForEvaluaciones = (req, res, next) => {
    if (req.isAuthenticated()) {
        const rol = (req.user.rol || '').toLowerCase().trim();
        if (rol === 'admin' || rol === 'administrador' || rol === 'medico' || rol === 'médico' || rol === 'enfermero' || rol === 'enfermera') {
            return next();
        }
    }
    req.flash('error', 'Acceso denegado.');
    res.redirect('/');
};

router.use(isAuthenticated);
router.use(isAuthorizedForEvaluaciones);

router.get('/', evaluacionesController.listarEvaluaciones);
router.get('/nueva/:id_admision', evaluacionesController.formularioNueva);
router.post('/nueva/:id_admision', evaluacionesController.guardarEvaluacion);

module.exports = router;