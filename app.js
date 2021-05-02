// Creamos app Express
let express = require('express');
let app = express();

// Directorio estático
app.use(express.static('public'));

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

// Rutas/controladores por lógica
require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/rtesting.js")(app, swig, gestorBD);

// Ruta inicial de la apliación
app.get('/', function (req, res) {
    let respuesta = swig.renderFile('views/bindex.html', {});
    res.send(respuesta);
});

// Lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('http://localhost:8081/');
});