// Módulos
let express = require('express');
let app = express();

// Variables
app.set('port', 8081);

// Rutas
app.get('/', function (req, res) {
    res.send("Funciona");
});

// Lanzar el servidor
app.listen(app.get('port'), function () {
    console.log('Servidor activo');
});