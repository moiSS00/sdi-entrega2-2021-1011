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
let routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    let token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > 240 ){
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                // También podríamos comprobar que intoToken.usuario existe
                return;

            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });

    } else {
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
    console.log("routerUsuarioSession");
    if (req.session.usuario) {
        gestorBD.obtenerUsuarios({email: req.session.usuario.email}, {}, function (usuarios) {
            if (usuarios == null) {
                res.redirect("/");
            } else {
                req.session.usuario = {
                    email: usuarios[0].email,
                    name: usuarios[0].name,
                    amount: usuarios[0].amount,
                    role: usuarios[0].role
                };
                // dejamos correr la petición
                next();
            }
        });
    } else {
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
    console.log("routerUsuarioStandardSession");
    if (req.session.usuario.role === "ROLE_STANDARD") {
        next();
    } else {
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
    console.log("routerUsuarioAdminSession");
    if (req.session.usuario.role === "ROLE_ADMIN") {
        next();
    } else {
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
    console.log("routerUsuarioOwner");

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
            res.redirect("/");
        } else {
            next();
        }
    });
});

//Aplicar routerUsuarioOwner
app.use("/standard/offer/remove", routerUsuarioOwner);

// Directorio estático
app.use(express.static('public'));

// Rutas/controladores por lógica
require("./routes/rUsuarios.js")(app, swig, gestorBD);
require("./routes/rOfertas.js")(app, swig, gestorBD);
require("./routes/rTesting.js")(app, gestorBD);
require("./routes/rApiOfertas.js")(app, gestorBD);

/*
Ruta inicial de la apliación.
Si hay un usuario logueado -> Se llama a la petición GET /admin/user/list si es admin o a la petición GET /standard/home
    si es estándar.
Si no hay un usuario logueado -> Se muestra la vista principal (index).
*/
app.get('/', function (req, res) {
    if (req.session.usuario) {
        if (req.session.usuario.role === "ROLE_ADMIN") {
            res.redirect("/admin/user/list");

        } else if (req.session.usuario.role === "ROLE_STANDARD") {
            res.redirect("/standard/home");
        }
    } else {
        let respuesta = swig.renderFile('views/bIndex.html', {});
        res.send(respuesta);
    }
});

app.use( function (err, req , res, next) {
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