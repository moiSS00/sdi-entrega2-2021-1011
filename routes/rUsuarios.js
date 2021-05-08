module.exports = function (app, swig, gestorBD, logger) {

    // ---- PETICIONES GET ----

    /*
    Muestra la vista que contiene el formulario para registrar a un usuario.
    */
    app.get("/signup", function (req, res) {
        logger.info("Se ha accedido al formulario de registro de usuario");
        let respuesta = swig.renderFile('views/bRegistro.html', {});
        res.send(respuesta);
    });

    /*
    Muestra la vista que contiene el formulario de inicio de sesión.
    */
    app.get("/login", function (req, res) {
        logger.info("Se ha accedido al formulario de inicio de sesión");
        let respuesta = swig.renderFile('views/bIdentificacion.html', {});
        res.send(respuesta);
    });

    /*
    Cierra la sesión actual y redirige al usuario a la página de login
    */
    app.get('/logout', function (req, res) {
        logger.info(req.session.usuario.email + " ha cerrado sesión");
        req.session.usuario = null;
        res.redirect('/login');
    });

    /*
    Muestra una vista que lista a todos los usuarios de la aplicación.
    Si hay algún error al recuperar la lista de usuarios -> Se le pasa a la vista una lista vacía.
    Si no hubo errroes -> Se muestra la vista con todos los usuarios de la aplicación (excepto el admin).
    */
    app.get("/admin/user/list", function (req, res) {
        // Variable que contendrá la respuesta
        let respuesta;
        // Se obtienen los usuarios (excepto los administradores)
        let criterio = {role: {$ne: "ROLE_ADMIN"}};
        let sort = {email: 1};
        gestorBD.obtenerUsuarios(criterio,sort, function (usuarios) {
            if (usuarios == null) { // Si hay error con la BD, se manda una lista vacía
                logger.error(req.session.usuario.email + " tuvo algún problema recuperando a los usuarios de la base de " +
                    "datos al acceder a la lista de usuarios");
                respuesta = swig.renderFile('views/bUsuarios.html', {
                    usuario: req.session.usuario,
                    usuarios: []
                });
            } else {
                logger.info(req.session.usuario.email + " ha accedido a la lista de usuarios");
                respuesta = swig.renderFile('views/bUsuarios.html', {
                    usuario: req.session.usuario,
                    usuarios: usuarios
                });
            }
            res.send(respuesta);
        });
    });

    /*
    Muestra la página personal del usuario actual (siendo este estándar).
    */
    app.get("/standard/home", function (req, res) {
        logger.info(req.session.usuario.email + " ha accedido a su página personal");
        // Variable que contendrá la respuesta
        let respuesta = swig.renderFile('views/bBienvenida.html', {usuario: req.session.usuario});
        res.send(respuesta);
    });

    // ---- PETICIONES POST ----

    /*
    Registra a un usuario añadiendolo a la base de datos
    Si se ha dejado algún campo vacío en el formulario -> Se llama a la petición GET /signup con un mensaje de error.
    Si las contraseñas introducidas en el formulario no coinciden -> Se llama a la petición
        GET /signup con un mensaje de error.
    Si el email introducido en el formulario ya está en uso -> Se llama a la petición
        GET /signup con un mensaje de error.
    Si hubo algún error al insertar al nuevo usuario  -> Se llama a la petición GET /signup con un mensaje de error.
    Si no hubo errores -> El usuario inicia sesión y se llama a la petición GET /user/home.
    */
    app.post('/signup', function (req, res) {

        // Se comprueba si ha dejado algún campo vacío
        if (!req.body.email || !req.body.name || !req.body.lastName || !req.body.password
            || !req.body.passwordConfirm) {
            logger.error("Se ha dejado algún campo vacío en el formulario de registro de un nuevo usuario");
            res.redirect("/signup" +
                "?mensaje=No puede dejar campos vacíos" +
                "&tipoMensaje=alert-danger ");
        }
        // Se comprueba si las contraseñas coinciden
        else if (!(req.body.password === req.body.passwordConfirm)) {
            logger.error("Las contraseñas no coinciden en el formulario de registro de un nuevo usuario");
            res.redirect("/signup" +
                "?mensaje=Las contraseñas no coinciden" +
                "&tipoMensaje=alert-danger ");
        } else {
            // Se obtienen los usuarios y se comprueba si el usuario ya existe
            gestorBD.obtenerUsuarios(
                {email: req.body.email}, {}, function (usuarios) {
                    if (usuarios == null) {
                        logger.error("Hubo algún problema al recuperar de la base de datos a los usuarios " +
                            "en el formulario de registro de un nuevo usuario");
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
                                amount: 100.00,
                                role: "ROLE_STANDARD"
                            }

                            // Añadimos al usuario a la base de datos
                            gestorBD.insertarUsuario(usuario, function (id) {
                                if (id == null) {
                                    logger.error("Hubo algún problema al insertar en la base de datos el usuario " +
                                        "en el formulario de registro de un nuevo usuario");
                                    res.redirect("/signup" +
                                        "?mensaje=Error al crear el usuario" +
                                        "&tipoMensaje=alert-danger ");
                                } else {
                                    req.session.usuario = {
                                        email: usuario.email,
                                        name: usuario.name,
                                        amount: usuario.amount,
                                        role: usuario.role
                                    };
                                    logger.info(req.session.usuario.email + " ha iniciado sesión correctamente");
                                    res.redirect("/");
                                }
                            });
                        } else {
                            logger.error("El email utilizado en el formulario de registro de un" +
                                " nuevo usuario ya existe");
                            res.redirect("/signup" +
                                "?mensaje=El email introducido ya está en uso" +
                                "&tipoMensaje=alert-danger ");
                        }
                    }
                });
        }
    });

    /*
    Inicia sesión en la aplicación.
    Si se ha dejado algún campo vacío en el formulario -> Se llama a la petición GET /login con un mensaje de error.
    Si hubo algún error recuperando al usuario que está logueado actualmente o el email ntroducido en el formulario
    no existe -> Se llama a la petición GET /login con un mensaje de error.
    Si no hubo errores -> El usuario inicia sesión y se llama a la petición GET /user/home.
    */
    app.post("/login", function (req, res) {

        // Se comprueba si ha dejado algún campo vacío
        if (!req.body.email || !req.body.password) {
            logger.error("Se ha dejado algún campo vacío en el formulario de inicio de sesión");
            res.redirect("/login" +
                "?mensaje=No puede dejar campos vacíos" +
                "&tipoMensaje=alert-danger ");
        } else {
            // Se obtiene al usuario
            let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            let criterio = {
                email: req.body.email,
                password: seguro
            }
            gestorBD.obtenerUsuarios(criterio, {}, function (usuarios) {
                if (usuarios == null || usuarios.length == 0) {
                    logger.error("No se ha encontrado el usuario con las credenciales inroducidas " +
                        "en el formulario de inicio de sesión");
                    res.redirect("/login" +
                        "?mensaje=Email incorrecto o contraseña incorrecta" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    req.session.usuario = {
                        email: usuarios[0].email,
                        name: usuarios[0].name,
                        amount: usuarios[0].amount,
                        role: usuarios[0].role
                    };
                    logger.info(req.session.usuario.email + " ha iniciado sesión correctamente");
                    res.redirect("/");
                }
            });
        }
    });

    /*
    Elimina los usuarios que tengan como id alguno de los ids que se pasan como parámetro.
    Si ha habido algún error al eliminar los mensajes de los usuarios eliminados -> Se llama a la petición
        GET /admin/user/list con un mensaje de error.
    Si ha habido algún error al eliminar las ofertas de los usuarios eliminados -> Se llama a la petición
        GET /admin/user/list con un mensaje de error.
    Si ha habido algún error al eliminar los usuarios -> Se llama a la petición GET /admin/user/list con
        un mensaje de error.
    Si no hubo errores -> Se llama a la petición GET /admin/user/list junto con un mensaje indicando que
        el borrado se realizó correctamente..
    */
    app.post("/admin/user/remove", function (req, res) {
        // Si llega un solo email, este se recibe como string
        // Si llega más de un email, los emails se reciben como un array
        let emails = [];
        emails = emails.concat(req.body.ids);

        // Eliminamos los mensajes de los usuarios seleccionados
        let criterio = { $or: [{sender: { $in: emails }}, {receiver: { $in: emails }}] };
        gestorBD.eliminarMensaje(criterio,function(mensajes){
            if ( mensajes == null ){
                logger.error(req.session.usuario.email + " tuvo algún problema al eliminar en la " +
                    "base de datos a los mensajes relacionados con la oferta que se quiere eliminar");
                res.redirect("/admin/user/list" +
                    "?mensaje=Error al eliminar a los usuarios seleccionados" +
                    "&tipoMensaje=alert-danger ");
            } else {
                // Se eliminan las ofertas de los usuarios seleccionados
                criterio = { owner: { $in: emails } };
                gestorBD.eliminarOferta(criterio,function(ofertas){
                    if ( ofertas == null ){
                        logger.error(req.session.usuario.email + " tuvo algún problema al eliminar las ofertas de los usuarios " +
                            "que se quieren eliminar de la lista de usuarios");
                        res.redirect("/admin/user/list" +
                            "?mensaje=Error al eliminar las ofertas de los usuarios seleccionados" +
                            "&tipoMensaje=alert-danger ");
                    } else { // Eliminamos a los usuarios seleccionados
                        criterio = { email: { $in: emails } };
                        gestorBD.eliminarUsuario(criterio,function(usuarios){
                            if ( usuarios == null ){
                                logger.error(req.session.usuario.email + " tuvo algún problema al eliminar en la " +
                                    "base de datos a los usuarios seleccionados en la lista de usuarios");
                                res.redirect("/admin/user/list" +
                                    "?mensaje=Error al eliminar a los usuarios seleccionados" +
                                    "&tipoMensaje=alert-danger ");
                            } else {
                                logger.info(req.session.usuario.email + " ha eliminado usuarios marcados en la " +
                                    "lista de usuarios con éxito");
                                res.redirect("/admin/user/list" +
                                    "?mensaje=Usuarios eliminados con éxito");
                            }
                        });
                    }
                });
            }
        });
    });

};