module.exports = function (app, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Busca todas las ofertas disponibles (ofertas en las que el usuario logueado no es el propietario)
    Si hay algún error al eliminar la oferta -> Error del servidor 500 (Se ha producido un error al
        recuperar las ofertas disponibles)
    Si no hubo errroes -> Respuesta satisfactoria 200 y se devuelven las ofertas encontradas.
    */
    app.get("/api/offer/availableOffers", function (req, res) {
        let criterio = {owner: {$ne: res.usuario}};
        gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al recuperar las ofertas disponibles"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(ofertas));
            }
        });
    });

    /*
    Busca todos los mensajes enviado por el usuario logueado y recibidos por el propitario de la oferta
        con el id especificado (offerId).
    Si hay algún error al recupear la oferta -> Error del servidor 500 (Se ha producido un error al
        recuperar los mensajes)
    Si no hubo errroes -> Respuesta satisfactoria 200 y se devuelven los mensajes encontradas ordenados
        por fecha de forma ascendente.
    */
    app.get("/api/message/list/:offerId", function (req, res) {
        let criterio = {
            $and: [{offerId: gestorBD.mongo.ObjectID(req.params.offerId)},
                {$or: [{sender: res.usuario}, {receiver: res.usuario}]}]
        };
        let sort = {creationDate: 1};
        gestorBD.obtenerMensajes(criterio, sort, function (mensajes) {
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error: "Se ha producido un error al recuperar los mensajes"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(mensajes));
            }
        });
    });


    // ---- PETICIONES POST ----


    /*
    Añade un mensaje a una conversación. Solo el intersado puede iniciar una conversación, es decir, crear el primer
        mensaje.
    Se debe recibir en formato JSON un mensaje (que no puede ser vacío) y el id de la oferta (que debe ser un id
        válido)
    Si se recibe un mensaje vacío o un id de oferta inválido -> Error del cliente 401 (Array con todos los
        errores encontrados).
    Si hay algún error al recuperar la oferta -> Error del servidor 500 (Error al recuperar la oferta).
    Si el usuario logueado es el propitario de la oferta -> Error del cliente 402 (Es el dueño de esta oferta).
    Si hay algún error al insertar el mensaje -> Error del servidor 500 (Error al crear el mensaje).
    Si no hubo errroes -> Respuesta satisfactoria  200 y se devuelve un mensaje informativo y el id del
        mensaje insertado en la base de datos.
    */
    app.post("/api/message/add", function (req, res) {
        let errores = [];

        if (!req.body.message) {
            errores.push("Debe incluir un mensaje que no sea vacío");
        }

        if (!gestorBD.mongo.ObjectID.isValid(req.body.offerId)) {
            errores.push("Debe incluir un id de oferta válido");
        }

        if (errores.length == 0) {
            let criterio = {_id: gestorBD.mongo.ObjectID(req.body.offerId)};
            gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
                if (ofertas == null || ofertas.length == 0) {
                    res.status(500);
                    res.json({
                        error: "Error al recuperar la oferta"
                    });
                } else {
                    if (ofertas[0].owner != res.usuario) {
                        let mensaje = {
                            sender: res.usuario,
                            receiver: ofertas[0].owner,
                            offerId: gestorBD.mongo.ObjectID(req.body.offerId),
                            message: req.body.message,
                            creationDate: new Date(),
                            read: false
                        }
                        gestorBD.insertarMensaje(mensaje, function (id) {
                            if (id == null) {
                                res.status(500);
                                res.json({
                                    error: "Error al crear el mensaje"
                                });
                            } else {
                                res.status(200);
                                res.json({
                                    mensaje: "mensaje insertado",
                                    _id: id
                                });
                            }
                        });
                    } else {
                        res.status(402);
                        res.json({
                            error: "Es el dueño de esta oferta"
                        });
                    }
                }
            });
        } else {
            res.status(401);
            res.json({
                errores: errores
            });
        }
    });

    /*
    Loguea al usuario en la aplicación (generando un Token único para este).
    Si hay algún error al eliminar la oferta -> Error del cliente 401 (valor booleano de autenticado a
        false, indicando que el usuario no se ha podido autenticar correctamente).
    Si no hubo errroes -> Respuesta satisfactoria 200 y se devuelve el token creado (junto con un booleano a true
        indicando que no hubo errores).
    */
    app.post("/api/login", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        let criterio = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(criterio, {}, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401);
                res.json({
                    autenticado: false
                });
            } else {
                let token = app.get('jwt').sign(
                    {usuario: criterio.email, tiempo: Date.now() / 1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                });
            }
        });
    });


};