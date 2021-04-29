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
                    res.redirect("/registrarse" +
                        "?mensaje=Error al recuperar el usuario" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    // Se comprueba si el usuario ya existe a traves de su email
                    if (usuarios.length == 0) {

                        // Se comprueba si ha dejado algún campo vacío
                        if (!req.body.email || !req.body.name || !req.body.lastName || !req.body.password) {
                            res.redirect("/registrarse" +
                                "?mensaje=No puede dejar campos vacíos" +
                                "&tipoMensaje=alert-danger ");
                        }

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
                                    res.redirect("/registrarse" +
                                        "?mensaje=Error al insertar el usuario" +
                                        "&tipoMensaje=alert-danger ");
                                } else {
                                    req.session.usuario = req.body.email;
                                    res.send('Usuario Insertado ' + id);
                                }
                            });
                        } else {
                            res.redirect("/registrarse" +
                                "?mensaje=Las contraseñas no coinciden" +
                                "&tipoMensaje=alert-danger ");
                        }
                    } else {
                        res.redirect("/registrarse" +
                            "?mensaje=El usuario ya existe" +
                            "&tipoMensaje=alert-danger ");
                    }
                }
            })
    });
};