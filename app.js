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

/*
Comprueba si el usuario actual está logueado en la aplicación.
Si no hay usuario logueado -> Se llama a la petición GET /login.
Si hubo algún error al recuperar el usuario actual -> Se llama a la petición GET /.
Si no hubo problemas -> Se deja pasar la petición.
*/
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
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
app.use("/standard",routerUsuarioSession);
app.use("/admin",routerUsuarioSession);

// routerUsuarioStandardSession
var routerUsuarioStandardSession = express.Router();

/*
Comprueba si el usuario actual es estándar.
Si el usuario actual no es estándar -> Se llama a la petición GET /.
Si el usuario actual es estándar -> Se deja pasar la petición.
*/
routerUsuarioStandardSession.use(function(req, res, next) {
    console.log("routerUsuarioStandardSession");
    if(req.session.usuario.role === "ROLE_STANDARD") {
        next();
    }
    else {
        res.redirect("/");
    }
});

//Aplicar routerUsuarioStandardSession
app.use("/standard",routerUsuarioStandardSession);

// routerUsuarioAdminSession
var routerUsuarioAdminSession = express.Router();

/*
Comprueba si el usuario actual es admin.
Si el usuario actual no es admin -> Se llama a la petición GET /.
Si el usuario actual es admin -> Se deja pasar la petición.
*/
routerUsuarioAdminSession.use(function(req, res, next) {
    console.log("routerUsuarioAdminSession");
    if(req.session.usuario.role === "ROLE_ADMIN") {
        next();
    }
    else {
        res.redirect("/");
    }
});

//Aplicar routerUsuarioAdminSession
app.use("/admin",routerUsuarioAdminSession);

// //routerUsuarioOwner
var routerUsuarioOwner = express.Router();

/*
Comprueba si el usuario actual es el creador de la oferta
*/
routerUsuarioOwner.use(function(req, res, next) {
    console.log("routerUsuarioOwner");
    let path = require('path');
    let id = path.basename(req.originalUrl);
    let criterio = {
        _id: mongo.ObjectID(id),
        owner: req.session.usuario.email
    }
    gestorBD.obtenerOfertas(criterio, {} , function (ofertas) {
            if(ofertas == null || ofertas.length == 0){
                res.redirect("/");
            } else {
                next();
            }
    });
});

//Aplicar routerUsuarioOwner
app.use("/standard/offer/remove",routerUsuarioOwner);

// Directorio estático
app.use(express.static('public'));

// Rutas/controladores por lógica
require("./routes/rUsuarios.js")(app, swig, gestorBD);
require("./routes/rOfertas.js")(app, swig, gestorBD);
require("./routes/rTesting.js")(app, swig, gestorBD);

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

        }
        else if (req.session.usuario.role === "ROLE_STANDARD") {
            res.redirect("/standard/home");
        }
    }
    else {
        let respuesta = swig.renderFile('views/bIndex.html', {});
        res.send(respuesta);
    }
});

// Lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('http://localhost:8081/');
});