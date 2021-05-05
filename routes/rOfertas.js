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
    */
    app.get("/standard/offer/myOffers", function (req, res) {

        // Variable que contendrá la respuesta
        let respuesta;

        // Se obtienen las ofertas del usuario actual y se ordenan por fecha de creación de forma descendente
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
                res.send(respuesta);
            }
        });
    });

    /*
    Elimina una oferta con un id específico.
    */
    app.get("/standard/offer/remove/:id", function (req, res) {
        let criterio = {_id: gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarOferta(criterio,function(ofertas){
            if ( ofertas == null ){
                //Este if - else es para el futuro sistema de log
                res.redirect("/standard/offer/myOffers" +
                    "?mensaje=Error al eliminar las ofertas de los usuarios seleccionados" +
                    "&tipoMensaje=alert-danger ");
            } else {
                res.redirect("/standard/offer/myOffers");
            }
        });
    });


    // ---- PETICIONES POST ----

    /*
    Añade una oferta con los datos introducidos en el formulario
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
                                owner: req.session.usuario.email
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