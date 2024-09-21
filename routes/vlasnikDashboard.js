const express = require('express');
const router = express.Router();


router.get('/', function(req, res, next) {
    // Proveri da li je korisnik prijavljen i da li je vlasnik
    if (!req.session.korisnik || req.session.korisnik.uloga !== 'vlasnik') {
        return res.redirect('/login'); // Ako nije, preusmeri na login
    }

    const connection = req.socket;
    const korisnikId = req.session.korisnik.id;

    const sqlDvorane = 'SELECT * FROM dvorana WHERE korisnik_id = ?';
    const sqlRezervacije = `
        SELECT rezervacija.*, dvorana.naziv AS dvorana_naziv 
        FROM rezervacija 
        INNER JOIN dvorana ON rezervacija.dvorana_id = dvorana.id
        WHERE dvorana.korisnik_id = ?
        ORDER BY rezervacija.datum_rezervacije DESC
    `;

    connection.query(sqlDvorane, [korisnikId], function(err, dvorane) {
        if (err) {
            console.error('Error fetching venues:', err);
            return next(err);
        }

        connection.query(sqlRezervacije, [korisnikId], function(err, rezervacije) {
            if (err) {
                console.error('Error fetching reservations:', err);
                return next(err);
            }

            const potvrdjene = rezervacije.filter(rez => rez.potvrdjena === 1);
            const zahtjevi = rezervacije.filter(rez => rez.potvrdjena === 0);

            res.render('vlasnikDashboard', {
                title: 'Vlasnik Dashboard',
                korisnik: req.session.korisnik,
                dvorane: dvorane,
                potvrdjene: potvrdjene,
                zahtjevi: zahtjevi
            });
        });
    });
});


// Add venue
router.get('/add', function(req, res) {
    // Render addVenue.ejs
    res.render('dodajDvoranu');
});

// Add venue
router.post('/add', function(req, res) {
    const { naziv, grad, slika, postanski_broj, ulica, cijena, automatske_rezervacije, dostupni_dani } = req.body;

    console.log('Received form data:', req.body);
    console.log(dostupni_dani);// Debug izjava za prikaz forme

    // Postavljanje vrednosti automatskih rezervacija
    const enableAutoReservations = automatske_rezervacije ? 1 : 0;

    // Insert dvorana
    const insertDvoranaSql = 'INSERT INTO dvorana (naziv, grad, slika, postanski_broj, ulica, cijena, automatske_rezervacije, korisnik_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    req.socket.query(insertDvoranaSql, [naziv, grad, slika, postanski_broj, ulica, cijena, enableAutoReservations, req.session.korisnik.id], function(err, result) {
        if (err) {
            console.error('Error adding venue:', err);
            return res.status(500).send('Error adding venue. Please try again later.');
        }

        const dvoranaId = result.insertId;

        console.log('Dvorana ID:', dvoranaId);  // Debug izjava za prikaz ID-a dodate dvorane



        if (enableAutoReservations && dostupni_dani && dostupni_dani.length > 0) {
            dostupni_dani.forEach(dan => {
                console.log('Inserting day:', dan);  // Debug izjava za prikaz trenutno dodatog dana

                const insertDostupniDaniSql = 'INSERT INTO dvorana_dan (dvorana_id, naziv_dana, dostupan) VALUES (?, ?, ?)';
                req.socket.query(insertDostupniDaniSql, [dvoranaId, dan, true], function(err) {
                    if (err) {
                        console.error('Error adding available day:', err);
                        return res.status(500).send('Error adding venue. Please try again later.');
                    }

                    console.log('Day inserted successfully:', dan);  // Debug izjava za prikaz uspešnog dodavanja dana
                });
            });
        }

        console.log('Venue and available days added successfully!');  // Debug izjava za prikaz uspešnog dodavanja dvorane i dana
        res.redirect('/vlasnikDashboard');
    });
});


router.get('/vlasnikRezervacije', function(req, res, next) {
    const connection = req.socket;
    const korisnikId = req.session.korisnik.id;

    const sql = `
        SELECT rezervacija.*, dvorana.naziv AS dvorana_naziv 
        FROM rezervacija 
        INNER JOIN dvorana ON rezervacija.dvorana_id = dvorana.id
        WHERE rezervacija.korisnik_id = ? 
        ORDER BY rezervacija.datum_rezervacije DESC
    `;

    connection.query(sql, [korisnikId], function(err, rezervacije) {
        if (err) {
            console.error('Error fetching reservations:', err);
            return next(err);
        }

        const potvrdjene = rezervacije.filter(rez => rez.potvrdjena === 1);
        const zahtjevi = rezervacije.filter(rez => rez.potvrdjena === 0);

        res.render('vlasnikRezervacije', {
            title: 'Rezervacije i zahtjevi',
            korisnik: req.session.korisnik,
            potvrdjene: potvrdjene,
            zahtjevi: zahtjevi
        });
    });
});



// Confirm reservation
router.post('/prihvatiRezervaciju/:id', function(req, res, next) {
    const rezervacijaId = req.params.id;
    const connection = req.socket;

    const sql = 'UPDATE rezervacija SET potvrdjena = 1 WHERE id = ?';

    connection.query(sql, [rezervacijaId], function(err, result) {
        if (err) {
            console.error('Error updating reservation:', err);
            return next(err);
        }

        res.redirect('/vlasnikDashboard');
    });
});

// Odbij rezervaciju
router.post('/odbijRezervaciju/:id', function(req, res, next) {
    const rezervacijaId = req.params.id;
    const connection = req.socket;

    const sql = 'DELETE FROM rezervacija WHERE id = ?';

    connection.query(sql, [rezervacijaId], function(err, result) {
        if (err) {
            console.error('Error deleting reservation:', err);
            return next(err);
        }

        res.redirect('/vlasnikDashboard');
    });
});


// Delete venue
router.post('/obrisiDvoranu/:id', function(req, res, next) {
    const connection = req.socket;
    const dvoranaId = req.params.id;

    // Delete reservations for the venue
    const deleteReservationsSql = 'DELETE FROM rezervacija WHERE dvorana_id = ?';
    connection.query(deleteReservationsSql, [dvoranaId], function(err) {
        if (err) {
            console.error('Error deleting reservations:', err);
            return next(err);
        }


        const deleteAvailableDaysSql = 'DELETE FROM dvorana_dan WHERE dvorana_id = ?';
        connection.query(deleteAvailableDaysSql, [dvoranaId], function(err) {
            if (err) {
                console.error('Error deleting available days:', err);
                return next(err);
            }

            const deleteVenueSql = 'DELETE FROM dvorana WHERE id = ?';
            connection.query(deleteVenueSql, [dvoranaId], function(err) {
                if (err) {
                    console.error('Error deleting venue:', err);
                    return next(err);
                }

                console.log('Venue and related data deleted successfully!');
                res.redirect('/vlasnikDashboard');
            });
        });
    });
});


// Edit venue
router.get('/edit/:id', function(req, res) {
    // Render editVenue.ejs
    res.render('editVenue', { venueId: req.params.id });
});

// View reservations
router.get('/reservations', function(req, res) {
    // Fetch reservations from the database and render them
    // res.render('reservations', { reservations: reservations });
});

// Toggle automatic reservations
router.post('/toggle-auto-reservations/:id', function(req, res) {
    // Toggle automatic reservations for a specific venue
    // Update the 'automatske_rezervacije' field in the database
});

module.exports = router;
