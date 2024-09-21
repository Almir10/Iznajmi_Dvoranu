const express = require('express');
const router = express.Router();

// Prikaz klijentDashboarda
router.get('/', function(req, res, next) {
    const connection = req.socket;
    const korisnikId = req.session.korisnik.id;

    // Dohvati potvrđene rezervacije za korisnika
    const sqlPotvrdjene = 'SELECT * FROM rezervacija WHERE korisnik_id = ? AND potvrdjena = 1';
    connection.query(sqlPotvrdjene, [korisnikId], function(err, potvrdjene) {
        if (err) {
            console.error('Error fetching confirmed reservations:', err);
            return next(err);
        }

        // Dohvati pending rezervacije za korisnika
        const sqlPending = 'SELECT * FROM rezervacija WHERE korisnik_id = ? AND potvrdjena = 0';
        connection.query(sqlPending, [korisnikId], function(err, pending) {
            if (err) {
                console.error('Error fetching pending reservations:', err);
                return next(err);
            }

            res.render('klijentDashboard', {
                title: 'Klijent Dashboard',
                korisnik: req.session.korisnik,
                potvrdjene: potvrdjene,
                pending: pending
            });
        });
    });
});

// Cancel rezervacija
router.post('/cancelRezervacija/:id', function(req, res, next) {
    const connection = req.socket;
    const rezervacijaId = req.params.id;

    const sql = 'DELETE FROM rezervacija WHERE id = ?';
    connection.query(sql, [rezervacijaId], function(err) {
        if (err) {
            console.error('Error canceling reservation:', err);
            return next(err);
        }
        res.redirect('/klijentDashboard');
    });
});

module.exports = router;
