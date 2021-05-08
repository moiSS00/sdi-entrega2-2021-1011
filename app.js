// Creamos app Express
let express = require('express');
let app = express();

// Habilitar cabeceras cabeceras Access-Controll-Allow-* para evitar bloqueos al cliente jQuery-Ajax
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    next();
});

// Módulos

// -- Log4js --
let log4js = require("log4js");
let logger = log4js.getLogger("MyWallapop");
logger.level = "debug";

// -- Jsonwebtoken  --
let jwt = require('jsonwebtoken');
app.set('jwt', jwt);

// -- ExpressSession --
let expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

// -- Crypto --
let crypto = require('crypto');

// -- MongoDB --
let mongo = require('mongodb');
let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app, mongo);

// -- Swig --
let swig = require('swig');

// -- Body Parser --
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Variables
app.set('port', 8081);
app.set('db', 'mongodb://admin:SDIadmin@tiendamusica-shard-00-00' +
    '.bnsce.mongodb.net:27017,tiendamusica-shard-00-01' +
    '.bnsce.mongodb.net:27017,tiendamusica-shard-00-02' +
    '.bnsce.mongodb.net:27017/tiendamusica?ssl=true&replicaSet=atlas-2mlqk1-shard-' +
    '0&authSource=admin&retryWrites=true&w=majority');
app.set('clave', 'abcdefg');
app.set('crypto', crypto);

// Routers

// routerUsuarioToken

/*
Usado para el cliente ligero JQuery/Ajax. Comprueba si el usuario actual está logueado en la aplicación
    haciendo uso de un token.
Si no se ha encontrado token -> Error del cliente 403 (No hay Token).
Si se encontró token y este no es válido -> Error del cliente 403 (Token invalido o caducado).
Si se encontró token y este es válido -> Se deja pasar la petición.
*/
let routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    logger.info("Se procederá a comprobar si el usuario esta logueado en la aplicación para poder acceder " +
        "a la funcionalidad de la que se quiere hacer uso");
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    let token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > 240 ) {
                logger.error("Un usuario no logueado " +
                    "ha intentado acceder una funcionalidad para los usuarios logueados en la aplicación");
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                return;
            } else {
                logger.info("Se le permite avanzar a " + infoToken.usuario
                    + " ya que este está logueado en la aplicación");
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
        logger.error("Un usuario no logueado " +
            "ha intentado acceder una funcionalidad para los usuarios logueados en la aplicación");
        res.status(403); // Forbidden
        res.json({
            acceso : false,
            mensaje: 'No hay Token'
        });
    }
});
// Aplicar routerUsuarioToken
app.use('/api/offer', routerUsuarioToken);
app.use('/api/message', routerUsuarioToken);

// routerUsuarioSession
var routerUsuarioSession = express.Router();

/*
Comprueba si el usuario actual está logueado en la aplicación.
Si no hay usuario logueado -> Se llama a la petición GET /login.
Si hubo algún error al recuperar el usuario actual -> Se llama a la petición GET /.
Si no hubo problemas -> Se deja pasar la petición.
*/
routerUsuarioSession.use(function (req, res, next) {
    logger.info("Se procederá a comprobar si el usuario esta logueado en la aplicación para poder acceder " +
        "a la funcionalidad de la que se quiere hacer uso");
    if (req.session.usuario) {
        gestorBD.obtenerUsuarios({email: req.session.usuario.email}, {}, function (usuarios) {
            if (usuarios == null) {
                logger.error("Hubo algún problema al recuperar de la base de datos al usuario " +
                    "que está logueado (" + req.session.usuario.email + ")");
                res.redirect("/");
            } else {
                req.session.usuario = {
                    email: usuarios[0].email,
                    name: usuarios[0].name,
                    amount: usuarios[0].amount,
                    role: usuarios[0].role
                };
                logger.info("Se le permite avanzar a " + req.session.usuario.email
                    + " ya que este está logueado en la aplicación");
                // dejamos correr la petición
                next();
            }
        });
    } else {
        logger.error("Un usuario no  logueado" +
            "ha intentado acceder una funcionalidad para los usuarios logueados en la aplicación");
        res.redirect("/login");
    }
});

//Aplicar routerUsuarioSession
app.use("/standard", routerUsuarioSession);
app.use("/admin", routerUsuarioSession);

// routerUsuarioStandardSession
var routerUsuarioStandardSession = express.Router();

/*
Comprueba si el usuario actual es estándar.
Si el usuario actual no es estándar -> Se llama a la petición GET /.
Si el usuario actual es estándar -> Se deja pasar la petición.
*/
routerUsuarioStandardSession.use(function (req, res, next) {
    logger.info("Se procederá a comprobar si el usuario tiene rol ROLE_STANDARD para poder acceder " +
        "a la funcionalidad de la que se quiere hacer uso");
    if (req.session.usuario.role === "ROLE_STANDARD") {
        logger.info("Se le permite avanzar a " + req.session.usuario.email
            + " ya que es un usuario " + req.session.usuario.role);
        next();
    } else {
        logger.error(req.session.usuario.email + " como usuario " + req.session.usuario.email +
            "ha intentado acceder una funcionalidad para los usuarios con rol ROLE_STANDARD");
        res.redirect("/");
    }
});

//Aplicar routerUsuarioStandardSession
app.use("/standard", routerUsuarioStandardSession);

// routerUsuarioAdminSession
var routerUsuarioAdminSession = express.Router();

/*
Comprueba si el usuario actual es admin.
Si el usuario actual no es admin -> Se llama a la petición GET /.
Si el usuario actual es admin -> Se deja pasar la petición.
*/
routerUsuarioAdminSession.use(function (req, res, next) {
    logger.info("Se procederá a comprobar si el usuario tiene rol ROLE_ADMIN para poder acceder " +
        "a la funcionalidad de la que se quiere hacer uso");
    if (req.session.usuario.role === "ROLE_ADMIN") {
        logger.info("Se le permite avanzar a " + req.session.usuario.email
            + " ya que es un usuario " + req.session.usuario.role);
        next();
    } else {
        logger.error(req.session.usuario.email + " como usuario " + req.session.usuario.email +
            "ha intentado acceder una funcionalidad para los usuarios con rol ROLE_ADMIN");
        res.redirect("/");
    }
});

//Aplicar routerUsuarioAdminSession
app.use("/admin", routerUsuarioAdminSession);

// //routerUsuarioOwner
var routerUsuarioOwner = express.Router();

/*
Comprueba si el usuario actual es el dueño de la oferta.
Si hubo algún error al recuperar las ofertas -> Se llama a la petición GET /.
Si el usuario actual no es el dueño de la oferta -> Se llama a la petición GET /.
Si el usuario actual es el dueño de la oferta -> Se deja pasar la petición.
*/
routerUsuarioOwner.use(function (req, res, next) {
    logger.info("Se procederá a comprobar si " + req.session.usuario.email
        + "el usuario logueado en el propietario de la oferta que se quiere manipular");

    //Obtenemos el id de la URL
    let path = require('path');
    let id = path.basename(req.originalUrl);

    // Verificamos si el usuario actual es el dueño de la oferta
    let criterio = {
        _id: mongo.ObjectID(id),
        owner: req.session.usuario.email
    }
    gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
        if (ofertas == null || ofertas.length == 0) {
            logger.error(req.session.usuario.email + " no es el propietario de la oferta que se esta intentando " +
                "manipular");
            res.redirect("/");
        } else {
            logger.info("Se le permite avanzar a " + req.session.usuario.email
                + " ya que es el propitario de la oferta que se quiere manipular");
            next();
        }
    });
});

//Aplicar routerUsuarioOwner
app.use("/standard/offer/remove", routerUsuarioOwner);

// Directorio estático
app.use(express.static('public'));

// Rutas/controladores por lógica
require("./routes/rUsuarios.js")(app, swig, gestorBD, logger);
require("./routes/rOfertas.js")(app, swig, gestorBD, logger);
require("./routes/rTesting.js")(app, gestorBD, logger);
require("./routes/rApiOfertas.js")(app, gestorBD, logger);

/*
Ruta inicial de la apliación.
Si hay un usuario logueado -> Se llama a la petición GET /admin/user/list si es admin o a la petición GET /standard/home
    si es estándar.
Si no hay un usuario logueado -> Se muestra la vista principal (index).
*/
app.get('/', function (req, res) {
    if (req.session.usuario) { // ¿ Usuario logueado ?
        if (req.session.usuario.role === "ROLE_ADMIN") { // ¿ admin ?
            logger.info(req.session.usuario.email + " al tener el rol de " + req.session.usuario.role
                + " es redirigido a la lista de usuarios");
            res.redirect("/admin/user/list");

        } else if (req.session.usuario.role === "ROLE_STANDARD") { // ¿ estándar ?
            logger.info(req.session.usuario.email + " al tener el rol de " + req.session.usuario.role
                + " es redirigido a su página personal");
            res.redirect("/standard/home");
        }
    } else {
        logger.info("Se muestra la página principal de la aplicación");
        let respuesta = swig.renderFile('views/bIndex.html', {});
        res.send(respuesta);
    }
});

/*
Recoge los errores 500, los tranforma en errores 400 y muestra una vista indicando que ha habido un error.
Esto se hace para evitar mostrar al usuario la traza cuando ocurra alguna excepción (motivos de seguridad)
*/
app.use( function
    (err, req , res, next) {
    console.error(err);
    if(! res.headersSent) {
        res.status(400);
        let respuesta = swig.renderFile('views/error.html',
            {
                mensajeError : "Recurso no disponible",
            });
        res.send(respuesta);
    }
});

// Lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('http://localhost:8081/');
});