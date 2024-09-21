const express = require('express');
const router = express.Router();

// Prikaz admin dashboarda
router.get('/', function(req, res, next) {
    const connection = req.socket;

    // Dohvati sve klijente
    const sqlKlijenti = 'SELECT * FROM korisnik WHERE uloga = "klijent"';
    connection.query(sqlKlijenti, function(err, klijenti) {
        if (err) {
            console.error('Error fetching clients:', err);
            return next(err);
        }

        // Dohvati sve vlasnike
        const sqlVlasnici = 'SELECT * FROM korisnik WHERE uloga = "vlasnik"';
        connection.query(sqlVlasnici, function(err, vlasnici) {
            if (err) {
                console.error('Error fetching owners:', err);
                return next(err);
            }

            // Dohvati sve dvorane
            const sqlDvorane = 'SELECT * FROM dvorana';
            connection.query(sqlDvorane, function(err, dvorane) {
                if (err) {
                    console.error('Error fetching venues:', err);
                    return next(err);
                }

                // Dohvati sve rezervacije
                const sqlRezervacije = 'SELECT * FROM rezervacija';
                connection.query(sqlRezervacije, function(err, rezervacije) {
                    if (err) {
                        console.error('Error fetching reservations:', err);
                        return next(err);
                    }

                    res.render('adminDashboard', {
                        title: 'Admin Dashboard',
                        klijenti: klijenti,
                        vlasnici: vlasnici,
                        dvorane: dvorane,
                        rezervacije: rezervacije
                    });
                });
            });
        });
    });
});

// Brisanje korisnika
router.post('/obrisiKorisnika/:id', function(req, res, next) {
    const connection = req.socket;
    const korisnikId = req.params.id;

    const sql = 'DELETE FROM korisnik WHERE id = ?';
    connection.query(sql, [korisnikId], function(err) {
        if (err) {
            console.error('Error deleting user:', err);
            return next(err);
        }
        res.redirect('/adminDashboard');
    });
});

// Brisanje dvorane
router.post('/obrisiDvoranu/:id', function(req, res, next) {
    const connection = req.socket;
    const dvoranaId = req.params.id;

    const sql = 'DELETE FROM dvorana WHERE id = ?';
    connection.query(sql, [dvoranaId], function(err) {
        if (err) {
            console.error('Error deleting venue:', err);
            return next(err);
        }
        res.redirect('/adminDashboard');
    });
});

// Brisanje rezervacije
router.post('/obrisiRezervaciju/:id', function(req, res, next) {
    const connection = req.socket;
    const rezervacijaId = req.params.id;

    const sql = 'DELETE FROM rezervacija WHERE id = ?';
    connection.query(sql, [rezervacijaId], function(err) {
        if (err) {
            console.error('Error deleting reservation:', err);
            return next(err);
        }
        res.redirect('/adminDashboard');
    });
});

module.exports = router;
