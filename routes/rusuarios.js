module.exports = function (app, swig, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Petición GET que muestra la vista que contiene el formulario para registrar
    a un usuario.
    */
    app.get("/signup", function (req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });

    /*
    Petición GET que muestra la vista que contiene el formulario de inicio
    de sesión.
    */
    app.get("/login", function (req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    /*
    Petición GET para cerrar sesión
    */
    app.get('/logout', function (req, res) {
        req.session.usuario = null;
        res.redirect('/login');
    })


    // ---- PETICIONES POST ----

    /*
    Petición POST que registra a un usuario añadiendolo a la base de datos
    */
    app.post('/signup', function (req, res) {

        // Se comprueba si ha dejado algún campo vacío
        if (!req.body.email || !req.body.name || !req.body.lastName || !req.body.password
            || !req.body.passwordConfirm) {
            res.redirect("/signup" +
                "?mensaje=No puede dejar campos vacíos" +
                "&tipoMensaje=alert-danger ");
        }
        // Se comprueba si las contraseñas coinciden
        else if (!(req.body.password === req.body.passwordConfirm)) {
            res.redirect("/signup" +
                "?mensaje=Las contraseñas no coinciden" +
                "&tipoMensaje=alert-danger ");
        } else {
            // Se obtienen los usuarios y se comprueba si el usuario ya existe
            gestorBD.obtenerUsuarios(
                {"email": req.body.email}, function (usuarios) {
                    if (usuarios == null) {
                        res.redirect("/signup" +
                            "?mensaje=Error inesperado" +
                            "&tipoMensaje=alert-danger ");
                    } else {
                        // Se comprueba si el usuario ya existe a traves de su email
                        if (usuarios.length == 0) {

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
                                    res.redirect("/signup" +
                                        "?mensaje=Error al insertar el usuario" +
                                        "&tipoMensaje=alert-danger ");
                                } else {
                                    req.session.usuario = req.body.email;
                                    let respuesta = swig.renderFile('views/bbienvenida.html', {
                                        email: req.body.email,
                                        name: req.body.name,
                                        amount: usuario.amount
                                    });
                                    res.send(respuesta);
                                }
                            });

                        } else {
                            res.redirect("/signup" +
                                "?mensaje=El email introducido ya está en uso" +
                                "&tipoMensaje=alert-danger ");
                        }
                    }
                });
        }
    });

    /*
    Petición POST para iniciar sesión en la aplicación
    */
    app.post("/login", function (req, res) {

        // Se comprueba si ha dejado algún campo vacío
        if (!req.body.email || !req.body.password) {
            res.redirect("/login" +
                "?mensaje=No puede dejar campos vacíos" +
                "&tipoMensaje=alert-danger ");
        } else {
            let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            let criterio = {
                email: req.body.email,
                password: seguro
            }
            gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                if (usuarios == null || usuarios.length == 0) {
                    res.redirect("/login" +
                        "?mensaje=Email incorrecto o contraseña incorrecta" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    req.session.usuario = usuarios[0].email;
                    let respuesta = swig.renderFile('views/bbienvenida.html', {
                        email: usuarios[0].email,
                        name: usuarios[0].name,
                        amount: usuarios[0].amount
                    });
                    res.send(respuesta);
                }
            });
        }
    });

};