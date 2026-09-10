require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const helmet = require('helmet');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const sequelize = require('./config/db');
require('./config/passport');

const app = express();

const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions'
});

app.use(helmet({
    contentSecurityPolicy: false
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || "unaFraseSecretaMuyLargaYComplejaParaTuAppHIS!",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated();
    const errorFlash = req.flash('error');
    const successFlash = req.flash('success');
    res.locals.success_msg = successFlash;
    res.locals.success = successFlash;
    res.locals.error_msg = errorFlash;
    res.locals.error = errorFlash;
    next();
});

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const medicoRouter = require('./routes/medico');
const pacienteRouter = require('./routes/paciente');
const alaRouter = require('./routes/ala');
const camaRouter = require('./routes/cama');
const habitacionRouter = require('./routes/habitacion');
const admisionesRouter = require('./routes/admisiones');
const altasRouter = require('./routes/altas');
const evaluacionesRouter = require('./routes/evaluaciones');
const turnosRouter = require('./routes/turnos');
const usuariosRouter = require('./routes/usuarios');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/medicos', medicoRouter);
app.use('/pacientes', pacienteRouter);
app.use('/alas', alaRouter);
app.use('/camas', camaRouter);
app.use('/habitaciones', habitacionRouter);
app.use('/admisiones', admisionesRouter);
app.use('/altas', altasRouter);
app.use('/evaluaciones', evaluacionesRouter);
app.use('/turnos', turnosRouter);
app.use('/usuarios', usuariosRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('🟢 Conexión a la DB establecida correctamente.');
        await sequelize.sync();
        console.log('🟢 Modelos de la DB sincronizados.');
        await sessionStore.sync();
        console.log('🟢 Tabla de sesiones sincronizada.');
    } catch (error) {
        console.error('🔴 Error de conexión o sincronización a la DB:', error);
    }
});

module.exports = app;