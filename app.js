// Creamos app Express
let express = require('express');
let app = express();

// Módulos

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
gestorBD.init(app,mongo);

// -- Swig --
let swig = require('swig');

// -- Body Parser --
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Variables
app.set('port', 8081);
app.set('db','mongodb://admin:SDIadmin@tiendamusica-shard-00-00' +
    '.bnsce.mongodb.net:27017,tiendamusica-shard-00-01' +
    '.bnsce.mongodb.net:27017,tiendamusica-shard-00-02' +
    '.bnsce.mongodb.net:27017/tiendamusica?ssl=true&replicaSet=atlas-2mlqk1-shard-' +
    '0&authSource=admin&retryWrites=true&w=majority');
app.set('clave','abcdefg');
app.set('crypto',crypto);

// Routers

// routerUsuarioSession
var routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
        // dejamos correr la petición
        next();
    } else {
        res.redirect("/login");
    }
});
//Aplicar routerUsuarioSession
app.use("/standard",routerUsuarioSession);
app.use("/admin",routerUsuarioSession);

// routerUsuarioStandardSession
var routerUsuarioStandardSession = express.Router();
routerUsuarioStandardSession.use(function(req, res, next) {
    console.log("routerUsuarioStandardSession");
    gestorBD.obtenerUsuarios(criterio = {email: req.session.usuario}, function (usuarios) {
        if (usuarios == null) {
            res.redirect("/");
        } else {
            if(usuarios[0].role === "ROLE_STANDARD") {
                next();
            }
            else {
                res.redirect("/");
            }
        }
    });
});
//Aplicar routerUsuarioStandardSession
app.use("/standard",routerUsuarioStandardSession);

// routerUsuarioAdminSession
var routerUsuarioAdminSession = express.Router();
routerUsuarioAdminSession.use(function(req, res, next) {
    console.log("routerUsuarioAdminSession");
    gestorBD.obtenerUsuarios(criterio = {email: req.session.usuario}, function (usuarios) {
        if (usuarios == null) {
            res.redirect("/");
        } else {
            if(usuarios[0].role === "ROLE_ADMIN") {
                next();
            }
            else {
                res.redirect("/");
            }
        }
    });
});
//Aplicar routerUsuarioAdminSession
app.use("/admin",routerUsuarioAdminSession);

// Directorio estático
app.use(express.static('public'));

// Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/rtesting.js")(app, swig, gestorBD);

/*
Ruta inicial de la apliación.
Si hay un usuario logueado -> Se llama a la petición GET /user/home.
Si no hay un usuario logueado -> Se muestra la vista principal (index).
*/
app.get('/', function (req, res) {
    gestorBD.obtenerUsuarios(criterio = {email: req.session.usuario}, function (usuarios) {
        if (usuarios == null || usuarios.length == 0) {
            let respuesta = swig.renderFile('views/bindex.html', {});
            res.send(respuesta);
        } else {
            if(usuarios[0].role === "ROLE_ADMIN") {
                res.redirect("/admin/user/list");
            }
            else {
                res.redirect("/standard/home");
            }
        }
    });
});

// Lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('http://localhost:8081/');
});