module.exports = function (app, swig, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Muestra la vista que contiene el formulario para dar de alta una nueva oferta.
    */
    app.get("/standard/offer/add", function (req, res) {
        let respuesta = swig.renderFile('views/bAgregarOferta.html', {
            usuario: req.session.usuario,
        });
        res.send(respuesta);
    });

    /*
    Muestra la vista con las ofertas creadas por el usuario que está actualmente logueado.
    Si hay algún error al recuperar la lista de ofertas del usuario actual -> Se le pasa a la vista una lista vacía.
    Si no hubo errroes -> Se muestra la vista con todos las ofertas del usuario actual.
    */
    app.get("/standard/offer/myOffers", function (req, res) {
        // Variable que contendrá la respuesta
        let respuesta;

        // Se obtienen las ofertas del usuario actual
        let criterio = {owner: req.session.usuario.email};
        let sort = {creationDate: -1};
        gestorBD.obtenerOfertas(criterio, sort, function (ofertas) {
            if (ofertas == null) {
                respuesta = swig.renderFile('views/bOfertasPropias.html', {
                    usuario: req.session.usuario,
                    ofertas: []
                });
            } else {
                respuesta = swig.renderFile('views/bOfertasPropias.html', {
                    usuario: req.session.usuario,
                    ofertas: ofertas
                });
            }
            res.send(respuesta);
        });
    });

    /*
    Muestra la vista que contiene todas las ofertas de la aplicación (excepto las del usuario logueado).
    */
    app.get("/standard/offer/searchOffers", function (req, res) {

        // Variable que contendrá la respuesta
        let respuesta;

        let criterio = {owner: {$ne: req.session.usuario.email}};
        if (req.query.searchText != null) {
            criterio = {
                $and: [{title: {$regex: ".*" + req.query.searchText + ".*", $options: "i"}},
                    {owner: {$ne: req.session.usuario.email}}]
            };
        }

        // Puede no venir el param
        let pg = parseInt(req.query.pg);
        if (req.query.pg == null) {
            pg = 1;
        }

        // Buscamos las ofertas correspondientes
        let sort = {creationDate: -1};
        gestorBD.obtenerOfertasPg(criterio, sort, pg, function (ofertas, total) {
            if (ofertas == null) {
                respuesta = swig.renderFile('views/bBuscarOferta.html', {
                    usuario: req.session.usuario,
                    ofertas: []
                });
            } else {
                let ultimaPg = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                respuesta = swig.renderFile('views/bBuscarOferta.html', {
                    usuario: req.session.usuario,
                    ofertas: ofertas,
                    paginas: paginas,
                    actual: pg,
                    searchText: req.query.searchText
                });
            }
            res.send(respuesta);
        });
    });

    /*
    Elimina una oferta con un id específico.
    Si hay algún error al eliminar la oferta -> Se llama a la petición GET /standard/offer/myOffers con
        un mensaje de error.
    Si no hubo errroes -> Se llama a la petición GET /standard/offer/myOffers.
    */
    app.get("/standard/offer/remove/:id", function (req, res) {
        let criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, {}, function (ofertas, total) {
            if (ofertas == null) {
                res.redirect("/standard/offer/myOffers" +
                    "?mensaje=Error al recuperar la oferta a eliminar" +
                    "&tipoMensaje=alert-danger ");
            } else {
                if (ofertas[0].buyer) {
                    res.redirect("/standard/offer/myOffers" +
                        "?mensaje=No se puede dar de baja una oferta que se haya vendido" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    gestorBD.eliminarOferta(criterio, function (ofertas) {
                        if (ofertas == null) {
                            //Este if - else es para el futuro sistema de log
                            res.redirect("/standard/offer/myOffers" +
                                "?mensaje=Error al eliminar la ofertas" +
                                "&tipoMensaje=alert-danger ");
                        } else {
                            res.redirect("/standard/offer/myOffers");
                        }
                    });
                }
            }
        });
    });


    // ---- PETICIONES POST ----

    /*
    Añade una oferta con los datos introducidos en el formulario
    Si se ha dejado algún campo vacío en el formulario -> Se muestra un mensaje de error.
    Si el título tiene una lóngitud de menos de 5 carácteres o de más de 20 carácteres -> Se muestra
        un mensaje de error.
    Si la descripctión tiene una lóngitud de menos de 5 carácteres o de más de 50 carácteres -> Se muestra
        un mensaje de error.
    Si se pasa un precio con un formato incorrecto o negativo -> Se muestra un mensaje de error.
    Si hubo algún error al insertar la nueva oferta en la base de datos -> Se muestra un mensaje de error.
    Si no hubo errores -> Se llama a la petición GET /standard/offer/myOffers.
    */
    app.post("/standard/offer/add", function (req, res) {

        // Comprobamos que no se ha dejado ningún campo vacío
        if (!req.body.title || !req.body.description || !req.body.price) {
            res.redirect("/standard/offer/add" +
                "?mensaje=No puede dejar campos vacíos" +
                "&tipoMensaje=alert-danger ");
        } else {
            // Comprobamos la longitud del título
            if (req.body.title.length < 5 || req.body.title.length > 20) {
                res.redirect("/standard/offer/add" +
                    "?mensaje=El título debe de tener una longitud mínima de 5 carácteres y una " +
                    "longitud máxima de 20 carácteres" +
                    "&tipoMensaje=alert-danger ");
            } else {
                // Comprobamos la longitud de la descripción
                if (req.body.description.length < 5 || req.body.description.length > 50) {
                    res.redirect("/standard/offer/add" +
                        "?mensaje=La descripción debe de tener una longitud mínima de 5 carácteres y una " +
                        "longitud máxima de 50 carácteres" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    // Se comprueba que el precio es un número
                    let precio = parseFloat(req.body.price);
                    if (precio) {
                        // Se comprueba que el precio sea positivo
                        if (precio >= 0) {
                            // Creamos la oferta a añadir
                            let oferta = {
                                title: req.body.title,
                                description: req.body.description,
                                price: precio.toFixed(2),
                                creationDate: new Date(),
                                owner: req.session.usuario.email,
                                buyer: null
                            }
                            // Añadimos la oferta a la base de datos
                            gestorBD.insertarOferta(oferta, function (id) {
                                if (id == null) {
                                    res.redirect("/signup" +
                                        "?mensaje=Error al crear la oferta" +
                                        "&tipoMensaje=alert-danger ");
                                } else {
                                    res.redirect("/standard/offer/myOffers");
                                }
                            });
                        } else {
                            res.redirect("/standard/offer/add" +
                                "?mensaje=El precio debe de ser un valor positivo" +
                                "&tipoMensaje=alert-danger ");
                        }
                    } else {
                        res.redirect("/standard/offer/add" +
                            "?mensaje=El precio debe de ser un número" +
                            "&tipoMensaje=alert-danger ");
                    }
                }
            }
        }
    });

};