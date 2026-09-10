const express = require('express');
const router = express.Router();
const { Usuario } = require('../models'); 
const bcrypt = require('bcryptjs'); 

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Por favor, inicia sesión para acceder a esta página.');
    res.redirect('/auth/login');
}

function esAdmin(user) {
    if (!user || !user.rol) return false;
    const rol = user.rol.toLowerCase().trim();
    return rol === 'admin' || rol === 'administrador';
}

router.get('/', ensureAuthenticated, async (req, res) => {
    if (!esAdmin(req.user)) {
        req.flash('error', 'No tienes permisos de administrador.');
        return res.redirect('/');
    }
    try {
        const buscar = (req.query.buscar || '').toLowerCase().trim();
        let usuarios = await Usuario.findAll(); 

        if (buscar) {
            usuarios = usuarios.filter(u => {
                const nombre = (u.nombre_usuario || '').toLowerCase();
                const email = (u.email || '').toLowerCase();
                const rol = (u.rol || '').toLowerCase();
                
                return nombre.includes(buscar) || email.includes(buscar) || rol.includes(buscar);
            });
        }

        res.render('usuarios/index', { title: 'Gestión de Usuarios', usuarios, buscar });
    } catch (error) {
        console.error(error);
        req.flash('error', 'No se pudieron cargar los usuarios.');
        res.redirect('/'); 
    }
});

router.get('/nuevo', ensureAuthenticated, (req, res) => {
    if (!esAdmin(req.user)) {
        req.flash('error', 'No autorizado.');
        return res.redirect('/');
    }
    res.render('usuarios/nuevo', { title: 'Crear Nuevo Usuario' });
});

router.post('/', ensureAuthenticated, async (req, res) => {
    if (!esAdmin(req.user)) return res.redirect('/');
    const { nombre_usuario, email, password, rol } = req.body;
    try {
        const existingUser = await Usuario.findOne({ where: { email: email } });
        if (existingUser) {
            req.flash('error', 'El email ya está registrado.');
            return res.redirect('/usuarios/nuevo');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Usuario.create({
            nombre_usuario,
            email,
            password_hash: hashedPassword, 
            rol
        });
        req.flash('success', 'Usuario creado exitosamente.');
        res.redirect('/usuarios');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al crear usuario. Verifique los datos.');
        res.redirect('/usuarios/nuevo');
    }
});

router.get('/editar/:id', ensureAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (!esAdmin(req.user) && req.user.id_usuario !== id) {
        req.flash('error', 'No tienes permiso para editar este perfil.');
        return res.redirect('/');
    }
    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/');
        }
        res.render('usuarios/editar', { title: 'Editar Usuario', usuario });
    } catch (error) {
        console.error(error);
        req.flash('error', 'No se pudo cargar el usuario.');
        res.redirect('/');
    }
});

router.post('/actualizar/:id', ensureAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (!esAdmin(req.user) && req.user.id_usuario !== id) {
        req.flash('error', 'No autorizado.');
        return res.redirect('/');
    }
    const { nombre_usuario, email, rol, password } = req.body; 
    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/');
        }

        usuario.nombre_usuario = nombre_usuario;
        usuario.email = email;
        
        if (esAdmin(req.user) && rol) {
            usuario.rol = rol;
        }

        if (password && password.trim() !== '') {
            usuario.password_hash = await bcrypt.hash(password, 10);
        }

        await usuario.save();
        req.flash('success', 'Datos actualizados exitosamente.');
        
        res.redirect(esAdmin(req.user) ? '/usuarios' : '/');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al actualizar. Verifique los datos.');
        res.redirect(`/usuarios/editar/${id}`);
    }
});

router.post('/eliminar/:id', ensureAuthenticated, async (req, res) => {
    if (!esAdmin(req.user)) {
        req.flash('error', 'No autorizado.');
        return res.redirect('/');
    }
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            req.flash('error', 'Usuario no encontrado.');
            return res.redirect('/usuarios');
        }
        await usuario.destroy();
        req.flash('success', 'Usuario eliminado exitosamente.');
        res.redirect('/usuarios');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al eliminar usuario.');
        res.redirect('/usuarios');
    }
});

module.exports = router;