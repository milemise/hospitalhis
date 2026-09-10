const express = require('express');
const router = express.Router();
const altaController = require('../controllers/altaController');

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Acceso denegado. Por favor, inicia sesión.');
    res.redirect('/auth/login');
};

router.use(isAuthenticated);

router.get('/nueva/:id_admision', altaController.formularioNueva);
router.post('/nueva/:id_admision', altaController.guardarAlta);

module.exports = router;