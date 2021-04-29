module.exports = function (app, swig, gestorBD) {

    /*
    Petición GET que muestra la vista que contiene el formulario para registrar
    a un usuario.
     */
    app.get("/registrarse", function (req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });

    /*
    Petición POST que registra a un usuario añadiendolo a la base de datos
     */
    app.post('/usuario', function (req, res) {

        // Se obtienen los usuarios y se comprueba que no hubo ningun error al obenerlos
        // de la base de datos
        gestorBD.obtenerUsuarios(
            {"email": req.body.email}, function (usuarios) {
                if (usuarios == null) {
                    res.send("Error al recuperar el usuario.");
                } else {
                    // Se comprueba si el usuario ya existe a traves de su email
                    if (usuarios.length == 0) {
                        if (req.body.password === req.body.confirmPassword) {
                            // Ecriptamos la contraseña introudcida por el usuario
                            let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
                                .update(req.body.password).digest('hex');

                            // Construimos el usuario a añadir
                            let usuario = {
                                email: req.body.email,
                                name: req.body.name,
                                lastName: req.body.lastName,
                                password: seguro,
                                amount: 100.0,
                                role: "ROLE_STANDARD"
                            }

                            // Añadimos al usuario a la base de datos
                            gestorBD.insertarUsuario(usuario, function (id) {
                                if (id == null) {
                                    res.send("Error al insertar el usuario");
                                } else {
                                    res.send('Usuario Insertado ' + id);
                                }
                            });
                        } else {
                            res.send('Las contraseñas no coinciden');
                        }
                    } else {
                        res.send('El usuario ya existe');
                    }
                }
            })
    });
};