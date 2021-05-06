module.exports = function (app, swig, gestorBD) {

    // ---- PETICIONES GET ----

    /*
    Petición GET que vacia toda la base de datos
    */
    app.get('/bd/clear', function (req, res) {
        let criterio = {};
        gestorBD.eliminarUsuario(criterio, function (usuarios) {
            if (usuarios == null) {
                res.send("Error al limpiar la colección de usuarios");
            } else {
                gestorBD.eliminarOferta(criterio, function (ofertas) {
                    if (ofertas == null) {
                        res.send("Error al limpiar la colección de ofertas");
                    } else {
                        res.send("Base de datos limpiada con éxito");
                    }
                });
            }
        });
    });


    /*
    Petición GET que inserta datos de prueba en la base de datos
    */
    app.get('/bd/insertSampleData', function (req, res) {
        let usuarios = [
            {
                email: "admin@email.com",
                name: "admin",
                lastName: "admin",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("admin").digest('hex'),
                amount: 100.00,
                role: "ROLE_ADMIN"
            },
            {
                email: "moises@email.com",
                name: "Moisés",
                lastName: "Sanjurjo Sánchez",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("123456").digest('hex'),
                amount: 100.00,
                role: "ROLE_STANDARD"
            },
            {
                email: "juan@email.com",
                name: "Juan",
                lastName: "Álvarez Álvarez",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("123456").digest('hex'),
                amount: 50.00,
                role: "ROLE_STANDARD"
            },
            {
                email: "manolo@email.com",
                name: "Manolo",
                lastName: "Sánchez Sánchez",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("123456").digest('hex'),
                amount: 1000.00,
                role: "ROLE_STANDARD"
            },
            {
                email: "pepe@email.com",
                name: "Pepe",
                lastName: "Pérez Pérez",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("123456").digest('hex'),
                amount: 142.25,
                role: "ROLE_STANDARD"
            },
            {
                email: "andrea@email.com",
                name: "Andrea",
                lastName: "Pérez Sánchez",
                password: app.get("crypto").createHmac('sha256', app.get('clave'))
                    .update("123456").digest('hex'),
                amount: 191.50,
                role: "ROLE_STANDARD"
            },
        ];
        gestorBD.insertarUsuario(usuarios, function (id) {
            if (id == null) {
                res.redirect("Error al insertar usuarios de prueba");
            } else {
                let ofertas = [
                    {
                        title: "Coche SEAT",
                        description: "Coche SEAT con 500 Km.",
                        price: 1500.00,
                        creationDate: new Date(2020, 5, 2, 23, 21, 2 , 1),
                        owner: "andrea@email.com",
                        buyer: null
                    },
                    {
                        title: "Pack material escolar",
                        description: "Pack 5 rotuladores BIC.",
                        price: 2.20,
                        creationDate: new Date(2018, 2, 7, 1, 3, 2 , 1),
                        owner: "andrea@email.com",
                        buyer: "juan@email.com"
                    },
                    {
                        title: "Disco duro",
                        description: "Disco duro de 500 Gb SSD.",
                        price: 100.00,
                        creationDate: new Date(2021, 2, 2, 23, 12, 1 , 3),
                        owner: "manolo@email.com",
                        buyer: "andrea@email.com"
                    },
                    {
                        title: "Televisión 4K",
                        description: "Para una buena tarde de Netflix.",
                        price: 80.99,
                        creationDate: new Date(2018, 7, 21, 12, 21, 2 , 30),
                        owner: "andrea@email.com",
                        buyer: null
                    },
                    {
                        title: "Película molona",
                        description: "Matrix.",
                        price: 3.20,
                        creationDate: new Date(2021, 2, 2, 2, 2, 5 , 5),
                        owner: "manolo@email.com",
                        buyer: null
                    },
                    {
                        title: "Ratón oficina",
                        description: "Ratón de uso diario inalámbrico.",
                        price: 9.80,
                        creationDate: new Date(2020, 7, 12, 21, 12, 7 , 16),
                        owner: "manolo@email.com",
                        buyer: "juan@email.com"
                    },
                    {
                        title: "Libro informática",
                        description: "Libro 'Internet es maravilloso' de la editorial SA.",
                        price: 10.50,
                        creationDate: new Date(2017, 2, 30, 12, 12, 2 , 5),
                        owner: "juan@email.com",
                        buyer: null
                    },
                    {
                        title: "Ordenador fijo HP",
                        description: "Con procesador AMD.",
                        price: 400.21,
                        creationDate: new Date(2020, 8, 10, 23, 21, 10 , 32),
                        owner: "juan@email.com",
                        buyer: null
                    },
                    {
                        title: "Película",
                        description: "Jurassic Park.",
                        price: 2.30,
                        creationDate: new Date(2017, 5, 2, 23, 32, 15 , 1),
                        owner: "pepe@email.com",
                        buyer: null
                    },
                    {
                        title: "coche BMW",
                        description: "Sin usar. Esta nuevo.",
                        price: 6000.00,
                        creationDate: new Date(),
                        owner: "pepe@email.com",
                        buyer: "juan@email.com"
                    },
                    {
                        title: "Micrófono",
                        description: "Para hacer ASMRs.",
                        price: 9.80,
                        creationDate: new Date(),
                        owner: "juan@email.com",
                        buyer: "pepe@email.com"
                    },
                ];
                gestorBD.insertarOferta(ofertas, function (id) {
                    if (id == null) {
                        res.redirect("Error al insertar ofertas de prueba");
                    } else {
                        res.send("Datos de prueba insertados con éxito");
                    }
                });
            }
        });
    });


};