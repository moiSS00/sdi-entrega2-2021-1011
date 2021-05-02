module.exports = function (app, swig, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Petición GET que vacia toda la base de datos
    */
    app.get('/bd/limpiar', function (req, res) {
        let criterio = {};
        gestorBD.eliminarUsuario(criterio, function (usuarios) {
            if (usuarios == null) {
                res.send("Error al limpiar la colección de usuarios");
            } else {
                res.send("Colección de usuarios limpiada con éxito");
            }
        });
    });


    /*
    Petición GET que inserta datos de prueba en la base de datos
    */
    app.get('/bd/prueba', function (req, res) {
        let usuarios = [
            {
                email: "admin@email.com",
                name: "admin",
                lastName: "admin",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("admin").digest('hex'),
                amount: 100.0,
                role: "ROLE_ADMIN"
            },
            {
                email: "moises@email.com",
                name: "Moisés",
                lastName: "Sanjurjo Sánchez",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("123456").digest('hex'),
                amount: 100.0,
                role: "ROLE_STANDARD"
            },
        ];
        gestorBD.insertarUsuario(usuarios, function (id) {
            if (id == null) {
                res.redirect("Error al insertar usuarios de prueba");
            } else {
                res.send("Datos de prueba insertados con éxito");
            }
        });
    });


};