var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('registration', { title: 'User Registration', session: req.session});
});

router.post('/', function(req, res, next) {
    var connection = req.socket;

    var ime = req.body.ime;
    var prezime = req.body.prezime;
    var email = req.body.email;
    var password = req.body.password;
    var uloga = req.body.uloga;


    if (!ime || !prezime || !email || !password || !uloga) {
        return res.status(400).send('Sva polja su obavezna.');
    }

    var query = 'INSERT INTO korisnik (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [ime, prezime, email, password, uloga], function(error, results, fields) {
        if (error) {
            console.error('Error registering user:', error);
            return res.status(500).send('Greška prilikom registracije. Pokušajte ponovo kasnije.');
        }
        res.redirect('/login');
    });
});

module.exports = router;
