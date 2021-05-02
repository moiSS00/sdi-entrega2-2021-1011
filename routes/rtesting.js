module.exports = function (app, swig, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Vaciar toda la base de datos
    */
    app.get('/bd/limpiar', function (req, res) {
        let criterio = {};
        gestorBD.eliminarUsuario(criterio,function(usuarios){
            if ( usuarios == null ){
                res.send("Error al limpiar la colección de usuarios");
            } else {
                res.send("Colección de usuarios limpiada con éxito");
            }
        });
    });


};