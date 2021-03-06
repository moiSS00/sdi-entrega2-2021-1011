module.exports = function (app, swig, gestorBD, logger) {

    // ---- PETICIONES GET ----

    /*
    Muestra la vista que contiene el formulario para dar de alta una nueva oferta.
    */
    app.get("/standard/offer/add", function (req, res) {
        logger.info(req.session.usuario.email + " ha accedido correctamente al formulario para dar de " +
            "alta una nueva oferta");
        let respuesta = swig.renderFile('views/bAgregarOferta.html', {
            usuario: req.session.usuario,
        });
        res.send(respuesta);
    });

    /*
    Muestra la vista con las ofertas creadas por el usuario que está actualmente logueado ordenadas por fecha de
    creación de forma descendente.
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
                logger.error(req.session.usuario.email + " tuvo algún problema al recuperar sus ofertas " +
                    "de la base de datos");
                respuesta = swig.renderFile('views/bOfertasPropias.html', {
                    usuario: req.session.usuario,
                    ofertas: []
                });
            } else {
                logger.info(req.session.usuario.email + " ha accedido correctamente a la lista de sus ofertas");
                respuesta = swig.renderFile('views/bOfertasPropias.html', {
                    usuario: req.session.usuario,
                    ofertas: ofertas
                });
            }
            res.send(respuesta);
        });
    });

    /*
    Muestra la vista que contiene todas las ofertas de la aplicación ordenadas por fecha de creación de forma
        descendente (excepto las del usuario logueado).
    Si hay algún error al recuperar la lista de ofertas disponibles -> Se le pasa a la vista una lista vacía.
    Si no hubo errroes -> Se muestra la vista con todos las ofertas disponibles para el usuario actual.
    */
    app.get("/standard/offer/searchOffers", function (req, res) {

        // Variable que contendrá la respuesta
        let respuesta;

        let criterio = {owner: {$ne: req.session.usuario.email}};

        // Puede no venir el param
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
                logger.error(req.session.usuario.email + " tuvo algún problema al recuperar las ofertas " +
                    "disponibles de la base de datos");
                respuesta = swig.renderFile('views/bBuscarOfertas.html', {
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
                respuesta = swig.renderFile('views/bBuscarOfertas.html', {
                    usuario: req.session.usuario,
                    ofertas: ofertas,
                    paginas: paginas,
                    actual: pg,
                    searchText: req.query.searchText
                });
                logger.info(req.session.usuario.email + " ha accedido correctamente a la lista de ofertas disponibles");
            }
            res.send(respuesta);
        });
    });

    /*
    Elimina una oferta con un id específico y la información relacionada con esta.
    Si hay algún error al recuperar la oferta -> Se llama a la petición GET /standard/offer/myOffers con
        un mensaje de error.
    Si hubo algún error al eliminar los mensajes relacionados con la oferta -> Se llama a la petición
        GET /standard/offer/myOffers con un mensaje de error.
    Si hubo algún error al eliminar la oferta -> Se llama a la petición GET /standard/offer/myOffers
        con un mensaje de error.
    Si no hubo errroes -> Se llama a la petición GET /standard/offer/myOffers junto con un mensaje indicando que
        el borrado se realizó correctamente.
    */
    app.get("/standard/offer/remove/:id", function (req, res) {
        // Se recupera la oferta con el id indicado
        let criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};

        gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
            if (ofertas == null) {
                logger.error(req.session.usuario.email + " tuvo algún problema recuperando de la base de datos " +
                    "la oferta a borrar");
                res.redirect("/standard/offer/myOffers" +
                    "?mensaje=Error al recuperar la oferta a eliminar" +
                    "&tipoMensaje=alert-danger ");
            } else {
                if (ofertas[0].buyer) { // ¿ Está comprada ?
                    logger.error(req.session.usuario.email + " intentó eliminar una oferta comprada");
                    res.redirect("/standard/offer/myOffers" +
                        "?mensaje=No se puede dar de baja una oferta vendida" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    // Se eliminan los mensajes relacionados con la oferta
                    criterio = {offerId: gestorBD.mongo.ObjectID(req.params.id)};
                    gestorBD.eliminarMensaje(criterio, function (mensajes) {
                        if (mensajes == null) {
                            logger.error(req.session.usuario.email + " tuvo algún problema eliminando de la base " +
                                "de datos los mensajes relacionados con la oferta que se quiere eliminar");
                            res.redirect("/standard/offer/myOffers" +
                                "?mensaje=Error al eliminar los mensajes relacionados con la oferta" +
                                "&tipoMensaje=alert-danger ");
                        } else {
                            // Se elimina la oferta
                            criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};
                            gestorBD.eliminarOferta(criterio, function (ofertas) {
                                if (ofertas == null) {
                                    logger.error(req.session.usuario.email + " tuvo algún problema eliminando " +
                                        "la oferta de la base de datos");
                                    res.redirect("/standard/offer/myOffers" +
                                        "?mensaje=Error al eliminar la oferta" +
                                        "&tipoMensaje=alert-danger ");
                                } else {
                                    logger.info(req.session.usuario.email + " ha eliminado la oferta con éxito");
                                    res.redirect("/standard/offer/myOffers" +
                                        "?mensaje=Oferta eliminada con éxito");
                                }
                            });
                        }
                    });
                }
            }
        });
    });


    /*
    Compra una oferta con un id en específico.
    Si hay algún error al recuperar la oferta -> Se llama a la petición GET /standard/offer/searchOffers con
        un mensaje de error.
    Si la oferta ya esta comprada -> Se llama a la petición GET /standard/offer/searchOffers con un mensaje de error.
    Si el saldo del cliente logueado no es suficiente para pagar la oferta -> Se llama a la petición
        GET /standard/offer/searchOffers con un mensaje de error.
    Si hubo algún error al modificar la oferta asignandole un comprador -> Se llama a la petición
        GET /standard/offer/searchOffers con un mensaje de error.
    Si hubo algún error al actualizar el saldo del usuario logueado -> Se llama a la petición
        GET /standard/offer/searchOffers con un mensaje de error.
    Si no hubo errroes -> Se llama a la petición GET /standard/offer/purchasedOffers junto con un mensaje indicando que
        la compra se realizó correctamente.
    */
    app.get("/standard/offer/buy/:id", function (req, res) {
        // Pueden no llegar estos param
        let params = "";
        if (req.query.pg != null) {
            params += "&pg=" + req.query.pg;
        }

        if (req.query.searchText != null) {
            params += "&searchText=" + req.query.searchText;
        }

        // Buscamos la oferta indicada por id
        let criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
            if (ofertas == null) {
                logger.error(req.session.usuario.email + " tuvo algún problema recuperando de la base de " +
                    "datos la oferta a comprar");
                res.redirect("/standard/offer/searchOffers" +
                    "?mensaje=Error al recuperar la oferta a comprar" +
                    "&tipoMensaje=alert-danger" + params);
            } else {
                if (ofertas[0].buyer) { // ¿ Está comprada ?
                    logger.error(req.session.usuario.email + " intentó comprar una oferta que ya se había vendido");
                    res.redirect("/standard/offer/searchOffers" +
                        "?mensaje=No se puede comprar una oferta vendida" +
                        "&tipoMensaje=alert-danger" + params);
                } else {
                    if (req.session.usuario.amount >= ofertas[0].price) { // ¿ Saldo suficiente ?
                        // Se modifica la oferta
                        gestorBD.modificarOferta(
                            criterio, {buyer: req.session.usuario.email}, function (result) {
                                if (result == null) {
                                    logger.error(req.session.usuario.email + " tuvo algún problema modificando " +
                                        "la oferta a comprar en la base de datos");
                                    res.redirect("/standard/offer/searchOffers" +
                                        "?mensaje=Error al comprar la oferta" +
                                        "&tipoMensaje=alert-danger" + params);
                                } else {
                                    // Se modifica el usuario
                                    criterio = {email: req.session.usuario.email};
                                    let newAmount = req.session.usuario.amount - ofertas[0].price;
                                    newAmount = parseFloat(newAmount.toFixed(2));
                                    gestorBD.modificarUsuario(
                                        criterio, {amount: newAmount}, function (result) {
                                            if (result == null) {
                                                logger.error(req.session.usuario.email + " tuvo algún problema " +
                                                    "modificando su monto en la base de datos");
                                                res.redirect("/standard/offer/searchOffers" +
                                                    "?mensaje=Error al comprar la oferta" +
                                                    "&tipoMensaje=alert-danger" + params);
                                            } else {
                                                logger.info(req.session.usuario.email + " ha comprado exitosamente " +
                                                    "la oferta");
                                                res.redirect("/standard/offer/purchasedOffers" +
                                                    "?mensaje=Oferta comprada con éxito");
                                            }
                                        });
                                }
                            });
                    } else {
                        logger.error(req.session.usuario.email + " intentó comprar una oferta con saldo insuficiente");
                        res.redirect("/standard/offer/searchOffers" +
                            "?mensaje=Saldo insuficiente para realizar la compra" +
                            "&tipoMensaje=alert-danger" + params);
                    }
                }
            }
        });
    });

    /*
    Muestra la vista con las ofertas compradas (ordenadas por fecha de creación de forma descendente) por el usuario
        que está logueado  actualmente.
    Si hubo algún error al recuperar las ofertas -> Se le pasa a la vista una lista vacía.
    Si no hubo errroes -> Se muestra la vista con todos las ofertas compradas por el usuario actual.
    */
    app.get("/standard/offer/purchasedOffers", function (req, res) {

        // Variable que contendrá la respuesta
        let respuesta;

        // Se obtienen las ofertas del usuario actual
        let criterio = {buyer: req.session.usuario.email};
        let sort = {creationDate: -1};
        gestorBD.obtenerOfertas(criterio, sort, function (ofertas) {
            if (ofertas == null) {
                logger.error(req.session.usuario.email + " tuvo algún problema recuperando de la base de datos " +
                    "sus ofertas compradas");
                respuesta = swig.renderFile('views/bOfertasCompradas.html', {
                    usuario: req.session.usuario,
                    ofertas: []
                });
            } else {
                logger.info(req.session.usuario.email + " ha accedido correctamente a la lista de sus " +
                    "ofertas compradas");
                respuesta = swig.renderFile('views/bOfertasCompradas.html', {
                    usuario: req.session.usuario,
                    ofertas: ofertas
                });
            }
            res.send(respuesta);
        });
    });

    /*
    Destaca una oferta (identificada por su id).
    Si el saldo del usuario no es suficiente -> Se llama a la petición GET /standard/offer/myOffers con
        un mensaje de error.
    Si hay algún error al modificar el saldo del usuario -> Se llama a la petición GET /standard/offer/myOffers con
        un mensaje de error.
    Si hay algún error al modificar la oferta marcandola como destacada -> Se llama a la petición
        GET /standard/offer/myOffers con un mensaje de error.
    Si no hubo errroes -> Se llama a la petición GET /standard/offer/myOffers junto con un mensaje indicando que
        la oferta se destacó correctamente.
    */
    app.get("/standard/offer/featured/:id", function (req, res) {
        // Se comprueba si el usuario tiene saldo suficiente para marcar la oferta como destacada
        if (req.session.usuario.amount >= 20) {
            // Se recupera la oferta a destacar
            let criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};
            gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
                if (ofertas == null) {
                    logger.error(req.session.usuario.email + " tuvo algún problema al recuperar la oferta " +
                        "a destacar de la base de datos");
                    res.redirect("/standard/offer/myOffers" +
                        "?mensaje=Error al recuperar la oferta" +
                        "&tipoMensaje=alert-danger");
                } else {
                    // Se comprueba si la oferta esta comprada
                    if (ofertas[0].buyer) {
                        logger.error(req.session.usuario.email + " intentó destacar una oferta que ya estaba comprada");
                        res.redirect("/standard/offer/myOffers" +
                            "?mensaje=No se puede destacar una oferta vendida" +
                            "&tipoMensaje=alert-danger");
                    } else {
                        // Se actualiza el saldo del usuario
                        criterio = {email: req.session.usuario.email};
                        let newAmount = req.session.usuario.amount - 20;
                        newAmount = parseFloat(newAmount.toFixed(2));
                        // Modificamos el saldo del usuario
                        gestorBD.modificarUsuario(
                            criterio, {amount: newAmount}, function (result) {
                                if (result == null) {
                                    logger.error(req.session.usuario.email + " tuvo algún problema " +
                                        "modificando su monto en la base de datos");
                                    res.redirect("/standard/offer/myOffers" +
                                        "?mensaje=Error al destacar la oferta" +
                                        "&tipoMensaje=alert-danger");
                                } else {
                                    // Se modifica la oferta marcandola como destacada
                                    criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};
                                    gestorBD.modificarOferta(
                                        criterio, {featured: true}, function (result) {
                                            if (result == null) {
                                                logger.error(req.session.usuario.email + " tuvo algún problema " +
                                                    "modificando la oferta a destacar en la base de datos");
                                                res.redirect("/standard/offer/myOffers" +
                                                    "?mensaje=Error al destacar la oferta" +
                                                    "&tipoMensaje=alert-danger");
                                            } else {
                                                logger.info(req.session.usuario.email + " ha destacado una oferta " +
                                                    "con éxito");
                                                res.redirect("/standard/offer/myOffers" +
                                                    "?mensaje=Oferta destacada con éxito");
                                            }
                                        });
                                }
                            });
                    }
                }
            });
        } else {
            logger.error(req.session.usuario.email + " intentó destacar una oferta con saldo insufciente");
            res.redirect("/standard/offer/myOffers" +
                "?mensaje=No tiene saldo suficiente para marcar la oferta como destacada" +
                "&tipoMensaje=alert-danger");
        }
    });

    // ---- PETICIONES POST ----

    /*
    Añade una oferta con los datos introducidos en el formulario.
    Si se ha dejado algún campo vacío en el formulario -> Se llama a la petición
        GET /standard/offer/add con un mensaje de error.
    Si el título tiene una longitud de menos de 5 carácteres o de más de 20 carácteres -> Se llama a la petición
        GET /standard/offer/add con un mensaje de error.
    Si la descripción tiene una longitud de menos de 5 carácteres o de más de 50 carácteres -> Se llama a la petición
        GET /standard/offer/add con un mensaje de error.
    Si se pasa un precio con un formato incorrecto o negativo -> Se llama a la petición
        GET /standard/offer/add con un mensaje de error.
   Si el usuario intenta destacar la oferta que se esta creando con saldo insuficiente -> Se llama a la petición
        GET /standard/offer/add con un mensaje de error.
    Si hubo algún error al insertar la nueva oferta en la base de datos -> Se llama a la petición
        GET /standard/offer/add con un mensaje de error.
    Si no hubo errores -> Se llama a la petición GET /standard/offer/myOffers con un mensaje informando de que la
        oferta se creo correctamente.
    */
    app.post("/standard/offer/add", function (req, res) {
        // Comprobamos que no se ha dejado ningún campo vacío
        if (!req.body.title || !req.body.description || !req.body.price) {
            logger.error(req.session.usuario.email + " se ha dejado algún campo vacío en el formulario para dar de " +
                "alta una nueva oferta");
            res.redirect("/standard/offer/add" +
                "?mensaje=No puede dejar campos vacíos" +
                "&tipoMensaje=alert-danger");
        } else {
            // Comprobamos la longitud del título
            if (req.body.title.length < 5 || req.body.title.length > 20) {
                logger.error(req.session.usuario.email + " ha dado un valor demasiado corto o demasiado largo para " +
                    "el título en el formulario para dar de alta una nueva oferta");
                res.redirect("/standard/offer/add" +
                    "?mensaje=El título debe de tener una longitud mínima de 5 caracteres y una " +
                    "longitud máxima de 20 caracteres" +
                    "&tipoMensaje=alert-danger ");
            } else {
                // Comprobamos la longitud de la descripción
                if (req.body.description.length < 5 || req.body.description.length > 50) {
                    logger.error(req.session.usuario.email + " ha dado un valor demasiado corto o demasiado " +
                        "largo para para la  descripción en el formulario para dar de alta una nueva oferta");
                    res.redirect("/standard/offer/add" +
                        "?mensaje=La descripción debe de tener una longitud mínima de 5 caracteres y una " +
                        "longitud máxima de 50 caracteres" +
                        "&tipoMensaje=alert-danger ");
                } else {
                    // Se comprueba que el precio es un número
                    let precio = parseFloat(req.body.price);
                    if (precio) {
                        // Se comprueba que el precio sea positivo
                        if (precio >= 0) {
                            // Se comprueba si se marcó o no la opción de destacar la oferta
                            // (El valor del checkbox llega como on / off)
                            let featured = false;
                            if (req.body.featured === "on") {
                                featured = true;
                            }
                            // Creamos la oferta a añadir
                            let oferta = {
                                title: req.body.title,
                                description: req.body.description,
                                price: parseFloat(precio.toFixed(2)),
                                creationDate: new Date(),
                                owner: req.session.usuario.email,
                                buyer: null,
                                featured: featured
                            }
                            // Si se quiere destacar la oferta
                            if (featured) {
                                // Comprobamos que el usuario tenga saldo suficiente para destacar la oferta
                                if (req.session.usuario.amount >= 20) {
                                    // Se modifica el saldo del usuario
                                    let criterio = {email: req.session.usuario.email};
                                    let newAmount = req.session.usuario.amount - 20;
                                    newAmount = parseFloat(newAmount.toFixed(2));
                                    gestorBD.modificarUsuario(
                                        criterio, {amount: newAmount}, function (result) {
                                            if (result == null) {
                                                logger.error(req.session.usuario.email + " tuvo algún problema " +
                                                    "modificando su monto en la base de datos");
                                                res.redirect("/standard/offer/searchOffers" +
                                                    "?mensaje=Error al crear la oferta" +
                                                    "&tipoMensaje=alert-danger");
                                            } else {
                                                // Añadimos la oferta a la base de datos
                                                gestorBD.insertarOferta(oferta, function (id) {
                                                    if (id == null) {
                                                        logger.error(req.session.usuario.email + "tuvo algún problema " +
                                                            "al destacar la oferta en la base de datos en el formulario " +
                                                            "para dar de alta una nueva oferta");
                                                        res.redirect("/standard/offer/add" +
                                                            "?mensaje=Error al crear la oferta" +
                                                            "&tipoMensaje=alert-danger ");
                                                    } else {
                                                        logger.info(req.session.usuario.email + " ha creado una oferta " +
                                                            "correctamente");
                                                        res.redirect("/standard/offer/myOffers" +
                                                            "?mensaje=Oferta creada con éxito");
                                                    }
                                                });
                                            }
                                        });
                                } else {
                                    logger.error(req.session.usuario.email + " intentó destacar una oferta con " +
                                        "saldo insufciente");
                                    res.redirect("/standard/offer/add" +
                                        "?mensaje=No tiene saldo suficiente para marcar la oferta como destacada" +
                                        "&tipoMensaje=alert-danger");
                                }
                            } else { // Si el usuario no qeuiere destacar la oferta
                                // Añadimos directamente la oferta a la base de datos
                                gestorBD.insertarOferta(oferta, function (id) {
                                    if (id == null) {
                                        logger.error(req.session.usuario.email + "tuvo algún problema al insertar en " +
                                            "la base de datos la oferta en el formulario para dar de alta una " +
                                            "nueva oferta");
                                        res.redirect("/standard/offer/add" +
                                            "?mensaje=Error al crear la oferta" +
                                            "&tipoMensaje=alert-danger");
                                    } else {
                                        logger.info(req.session.usuario.email + " ha creado una oferta correctamente");
                                        res.redirect("/standard/offer/myOffers" +
                                            "?mensaje=Oferta creada con éxito");
                                    }
                                });
                            }
                        } else {
                            logger.error(req.session.usuario.email + " ha dado un precio negativo " +
                                "en el formulario para dar de alta una nueva oferta");
                            res.redirect("/standard/offer/add" +
                                "?mensaje=El precio debe de ser un valor positivo" +
                                "&tipoMensaje=alert-danger ");
                        }
                    } else {
                        logger.error(req.session.usuario.email + " ha dado un precio en formato incorrecto " +
                            "en el formulario para dar de alta una nueva oferta");
                        res.redirect("/standard/offer/add" +
                            "?mensaje=El precio debe de ser un número" +
                            "&tipoMensaje=alert-danger ");
                    }
                }
            }
        }
    });

};