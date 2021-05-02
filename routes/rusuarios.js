module.exports = function (app, swig, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Muestra la vista que contiene el formulario para registrar a un usuario.
    */
    app.get("/signup", function (req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });

    /*
    Muestra la vista que contiene el formulario de inicio de sesión.
    */
    app.get("/login", function (req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    /*
    Cierra la sesión actual y redirige al usuario a la página de login
    */
    app.get('/logout', function (req, res) {
        req.session.usuario = null;
        res.redirect('/login');
    });

    /*
    Muestra una vista que lista a todos los usuarios de la aplicación.
    Si hay algún error recuperando al usuario logueado actualmente -> Se llama a la petición GET /logout.
    Si hay algún error al recuperar la lista de usuarios -> Se le pasa a la vista una lista vacía.
    Si no hubo errroes -> Se muestra la vista con todos los usuarios de la aplicación (excepto el admin).
    */
    app.get("/user/list", function (req, res) {
        // Obtenemos al usuario actual
        gestorBD.obtenerUsuarios(criterio = {email: req.session.usuario}, function (admin) {
            if (admin == null || admin.length == 0) {
                res.redirect("/logout");
            } else {
                // Variable que contendrá la respuesta
                let respuesta;
                // Se obtienen los usuarios y se comprueba si el usuario ya existe
                let criterio = {email: {$ne: "admin@email.com"}};
                gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                    if (usuarios == null) { // Si hay error con la BD, se manda una lista vacía
                        respuesta = swig.renderFile('views/busuarios.html', {
                            usuario: admin[0],
                            usuarios: []
                        });
                    } else {
                        respuesta = swig.renderFile('views/busuarios.html', {
                            usuario: admin[0],
                            usuarios: usuarios
                        });
                    }
                    res.send(respuesta);
                });
            }
        });
    });

    /*
    Petición GET que muestra la página personal del usuario actual.
    Si hay algún error recuperando al usuario logueado actualmente -> Se llama a la petición GET /logout.
    Si el usuario logueado actualmente es admin -> Se llama a la petición GET /user/list.
    Si el usuario logueado actualmente es estándar -> Se muestra la página de bienvenida para ese usuario.
    */
    app.get("/user/home", function (req, res) {
        // Variable que contendrá la respuesta
        let respuesta;

        // Se obtienen los usuarios y se comprueba si el usuario ya existe
        gestorBD.obtenerUsuarios(criterio = {email: req.session.usuario}, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.redirect("/logout");
            } else {
                if(usuarios[0].role === "ROLE_ADMIN") {
                    res.redirect("/user/list");
                }
                else {
                    let respuesta = swig.renderFile('views/bbienvenida.html', {usuario: usuarios[0]});
                    res.send(respuesta);
                }
            }
        });
    });


    // ---- PETICIONES POST ----

    /*
    Petición POST que registra a un usuario añadiendolo a la base de datos
    Si se ha dejado algún campo vacío en el formulario -> Se muestra un mensaje de error.
    Si las contraseñas introducidas en el formulario no coinciden -> Se muestra un mensaje de error.
    Si el email introducido en el formulario ya está en uso -> Se muestra un mensaje de error.
    Si hubo algún error al insertar al nuevo usuario  -> Se muestra un mensaje de error.
    Si no hubo errores -> El usuario inicia sesión y se llama a la petición GET /user/home.
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
                                    res.redirect("/user/home");
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
    Petición POST para iniciar sesión en la aplicación.
    Si se ha dejado algún campo vacío en el formulario -> Se muestra un mensaje de error.
    Si hubo algún error recuperando al usuario que está logueado actualmente o el email ntroducido en el formulario
    no existe -> Se muestra un mensaje de error.
    Si no hubo errores -> El usuario inicia sesión y se llama a la petición GET /user/home.
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
                    res.redirect("/user/home");
                }
            });
        }
    });
};