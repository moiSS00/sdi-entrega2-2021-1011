module.exports = function (app, gestorBD) {

    // ---- PETICIONES GET ----

    app.get("/api/offer/availableOffers", function (req, res) {
        let criterio = {owner: {$ne: res.usuario}};
        gestorBD.obtenerOfertas(criterio, {}, function (ofertas) {
            if (ofertas == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(ofertas));
            }
        });
    });

    app.get("/api/message/list/:offerId", function (req, res) {
        let criterio = {
            $and: [{offerId: req.params.offerId},
                {$or: [{sender: res.usuario}, {receiver: res.usuario}]}]
        };
        let sort = {creationDate: 1};
        gestorBD.obtenerMensajes(criterio, sort, function (mensajes) {
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(mensajes));
            }
        });
    });


    // ---- PETICIONES POST ----

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
                    res.status(401);
                    res.json({
                        error: "Error al recuperar la oferta"
                    });
                } else {
                    if (ofertas[0].owner != res.usuario) {
                        let mensaje = {
                            sender: res.usuario,
                            receiver: ofertas[0].owner,
                            offerId: req.body.offerId,
                            message: req.body.message,
                            creationDate: new Date(),
                            read: false
                        }
                        gestorBD.insertarMensaje(mensaje, function (id) {
                            if (id == null) {
                                res.status(403);
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
            res.status(400);
            res.json({
                errores: errores
            });
        }
    });

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