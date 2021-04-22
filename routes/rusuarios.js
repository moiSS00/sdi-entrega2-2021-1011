module.exports = function(app, swig, gestorBD) {

    app.get('/', function (req, res) {
        let respuesta = swig.renderFile('views/bprueba.html', {

        });
        res.send(respuesta);
    });

};