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
        }
        else {
            // Se comprueba que el precio es un número
            let precio = parseFloat(req.body.price);
            if(precio) {
                // Se comprueba que el precio sea positivo
                if(precio >= 0) {
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
                            res.redirect("/");
                        }
                    });
                }
                else {
                    res.redirect("/standard/offer/add" +
                        "?mensaje=El precio debe de ser un valor positivo" +
                        "&tipoMensaje=alert-danger ");
                }
            }
            else {
                res.redirect("/standard/offer/add" +
                    "?mensaje=El precio debe de ser un número" +
                    "&tipoMensaje=alert-danger ");
            }
        }

    });

};