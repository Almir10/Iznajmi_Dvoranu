var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('login', { title: 'User Login', session: req.session });
});

router.post('/', function(req, res, next) {
    var connection = req.socket;

    var email = req.body.email;
    var password = req.body.sifra;

    if (!email || !password) {
        return res.status(400).send('Email i sifra su neophodni.');
    }

    if (email && password) {
        connection.query('SELECT * FROM korisnik WHERE email = ? AND sifra = ?', [email, password], function(error, results, fields) {
            if (error) throw error;

            if (results.length > 0) {
                req.session.email = email;
                req.session.korisnik = results[0];

                res.redirect('/');  // Preusmeravanje na početnu stranicu nakon uspešnog logina
            } else {
                res.send('Pogrešna šifra! <a href="/login">Pokušajte ponovo</a>');
            }
        });
    } else {
        res.send('Unesite email i šifru! <a href="/login">Pokušajte ponovo</a>');
    }
});

module.exports = router;
