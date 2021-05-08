module.exports = {
    mongo: null,
    app: null,
    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },

    /*
    Inserta usuarios en la base de datos.
    Recibe los usuarios a insertar y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el id del primer usuario insertado en la base de datos.
    */
    insertarUsuario: function (usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.insert(usuario, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Devuelve los usuarios de la base de datos que cumplan un criterio.
    Recibe el criterio de búsqueda, un criterio de ordenación que se aplicará al resultado de la búsqueda
        y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe los usuarios encontrados y ordenados según el criterio
        especificado.
    */
    obtenerUsuarios: function (criterio, sort, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.find(criterio).sort(sort).toArray(function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Elimina los usuarios de la base de datos que cumplan un criterio.
    Recibe el criterio de eliminación y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el resultado de la operación de borrado.
    */
    eliminarUsuario: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.remove(criterio, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Modifica los usuarios de la base de datos que cumplan un criterio.
    Recibe el criterio, los campos a modificar y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el resultado de la operación.
    */
    modificarUsuario : function(criterio, usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('usuarios');
                collection.update(criterio, {$set: usuario}, function(err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Inserta ofertas en la base de datos.
    Recibe la oferta a insertar y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el id de la primera oferta insertada en la base de datos.
    */
    insertarOferta: function (oferta, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('ofertas');
                collection.insert(oferta, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Devuelve las ofertas de la base de datos que cumplan un criterio.
    Recibe el criterio de búsqueda, un criterio de ordenación que se aplicará al resultado de la búsqueda
        y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe las ofertas encontradas y ordenadas según el criterio
        especificado.
    */
    obtenerOfertas: function (criterio, sort, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('ofertas');
                collection.find(criterio).sort(sort).toArray(function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Devuelve las ofertas de la base de datos que cumplan un criterio (apoyandose en un sistema de paginación de
        5 ofertas por página).
    Recibe el criterio de búsqueda, un criterio de ordenación que se aplicará al resultado de la búsqueda,
        el número de la página deseada y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe las ofertas encontrados correspondientes a la página indcada
        (ordenadas según el criterio especificado) y el número de ofertas encontradas que cumplen el criterio de búsqueda.
    */
    obtenerOfertasPg: function (criterio, sort, pg, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('ofertas');

                collection.count(criterio, function (err, count) {
                    collection.find(criterio).sort(sort).skip((pg - 1) * 5).limit(5)
                        .toArray(function (err, ofertas) {
                            if (err) {
                                funcionCallback(null);
                            } else {
                                funcionCallback(ofertas, count);
                            }
                            db.close();
                        });
                });
            }
        });
    },

    /*
    Elimina las ofertas de la base de datos que cumplan un criterio.
    Recibe el criterio de eliminación y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el resultado de la operación de borrado.
    */
    eliminarOferta: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('ofertas');
                collection.remove(criterio, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Modifica las ofertas de la base de datos que cumplan un criterio.
    Recibe el criterio, los campos a modificar y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el resultado de la operación.
    */
    modificarOferta : function(criterio, oferta, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function(err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('ofertas');
                collection.update(criterio, {$set: oferta}, function(err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Inserta mensajes en la base de datos.
    Recibe el mensaje a insertar y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el id del primer mensaje insertado en la base de datos.
    */
    insertarMensaje: function (mensaje, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('messages');
                collection.insert(mensaje, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result.ops[0]._id);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Devuelve los mensajes de la base de datos que cumplan un criterio.
    Recibe el criterio de búsqueda, un criterio de ordenación que se aplicará al resultado de la búsqueda
        y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe los mensajes encontrados y ordenados según el criterio
        especificado.
    */
    obtenerMensajes: function (criterio, sort, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('messages');
                collection.find(criterio).sort(sort).toArray(function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },

    /*
    Elimina los mensajes de la base de datos que cumplan un criterio.
    Recibe el criterio de eliminación y la función de callback a usar.
    Si hubo algún error al conectarse a la base de datos -> La función de callback recibe null.
    Si no hubo problemas -> La función de callback recibe el resultado de la operación de borrado.
    */
    eliminarMensaje: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                let collection = db.collection('messages');
                collection.remove(criterio, function (err, result) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        funcionCallback(result);
                    }
                    db.close();
                });
            }
        });
    },
};