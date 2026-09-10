const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Has cerrado sesión correctamente.');
    res.redirect('/auth/login');
  });
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.post('/register', async (req, res) => {
  try {
    // Vemos en consola qué está llegando realmente del formulario
    console.log("📨 Datos intentando guardar:", req.body);
    
    const { nombre_usuario, email, password, rol } = req.body;
    
    const existingUser = await Usuario.findOne({ where: { email: email } });
    if (existingUser) {
      req.flash('error', 'El email ya está registrado.');
      return res.redirect('/auth/register');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Intento de creación
    await Usuario.create({
      nombre_usuario: nombre_usuario,
      email: email,
      password_hash: hashedPassword,
      rol: rol
    });
    
    req.flash('success', 'Usuario registrado exitosamente. Por favor, inicia sesión.');
    res.redirect('/auth/login');
    
  } catch (error) {
    console.error('🔴 ERROR CRÍTICO AL GUARDAR EN BD:', error);
    // Le mostramos a la vista el error exacto de la base de datos
    req.flash('error', 'Fallo en la BD: ' + error.message);
    res.redirect('/auth/register');
  }
});

module.exports = router;