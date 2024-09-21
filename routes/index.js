var express = require('express');
var router = express.Router();



router.get('/', function(req, res, next) {
  var connection = req.socket;

  var sql = 'SELECT * FROM dvorana';
  connection.query(sql, function(err, dvorane) {
    if (err) {
      console.error('Error fetching venues from database:', err);
      return next(err);
    }

    res.render('index', { title: 'Početna stranica', korisnik: req.session.korisnik ? req.session.korisnik : null, dvorane: dvorane });
  });
});

router.get('/dvoranaDetalji/:id', function(req, res, next) {
  var connection = req.socket;
  var venueId = req.params.id;

  console.log('Fetching venue details for ID:', venueId);  // Debug ispis

  var sqlDvorana = 'SELECT * FROM dvorana WHERE id = ?';
  connection.query(sqlDvorana, [venueId], function(err, dvorana) {
    if (err) {
      console.error('Error fetching venue details from database:', err);
      return next(err);
    }

    console.log('Fetched venue:', dvorana[0]);  // Debug ispis

    if (!dvorana[0]) {
      console.error('Venue not found for ID:', venueId);
      return res.status(404).send('Venue not found');
    }

    // Dohvaćanje dostupnih dana za odabranu dvoranu
    var sqlDostupniDani = 'SELECT naziv_dana FROM dvorana_dan WHERE dvorana_id = ?';
    connection.query(sqlDostupniDani, [venueId], function(err, result) {
      if (err) {
        console.error('Error fetching available days from database:', err);
        return next(err);
      }

      var dostupniDani = result.map(row => row.naziv_dana);

      // Dohvaćanje svih rezervacija za odabranu dvoranu
      var sqlRezervacije = 'SELECT datum_rezervacije FROM rezervacija WHERE dvorana_id = ?';
      connection.query(sqlRezervacije, [venueId], function(err, rezervacije) {
        if (err) {
          console.error('Error fetching reservations from database:', err);
          return next(err);
        }

        var zauzetiDani = rezervacije.map(row => row.datum_rezervacije);

        res.render('dvoranaDetalji', {
          title: 'Detalji dvorane',
          session: req.session,
          korisnik: req.session.korisnik,
          dvorana: dvorana[0],
          dostupniDani: dostupniDani,
          zauzetiDani: zauzetiDani  // Dodajemo zauzete datume u kontekst
        });
      });
    });
  });
});



router.post('/rezervacija', function(req, res, next) {
  var connection = req.socket;
  var datum = req.body.datum;
  var dvoranaId = req.body.dvoranaId;
  var potvrdjena = req.body.potvrdjena;
  var korisnikId = req.session.korisnik.id; // Pretpostavljamo da je korisnik prijavljen
  var automatskeRezervacije = req.body.automatskeRezervacije; // Dodajemo ovo polje u body zahtjeva

  // Provjera da li postoji rezervacija za odabrani datum i dvoranu
  var sqlProvjera = 'SELECT * FROM rezervacija WHERE datum_rezervacije = ? AND dvorana_id = ?';
  connection.query(sqlProvjera, [datum, dvoranaId], function(err, rezultat) {
    if (err) {
      console.error('Error checking for existing reservation:', err);
      return next(err);
    }

    if (rezultat.length > 0) {
      return res.status(400).send('Već postoji rezervacija za odabrani datum i dvoranu.');
    }

    // Dodavanje nove rezervacije// Postavljamo potvrđenost na 1 ako su automatske rezervacije uključene, inače na 0
    var sqlRezervacija = 'INSERT INTO rezervacija (datum_rezervacije, potvrdjena, dvorana_id, korisnik_id) VALUES (?, ?, ?, ?)';
    connection.query(sqlRezervacija, [datum, potvrdjena, dvoranaId, korisnikId], function(err, rezultat) {
      if (err) {
        console.error('Error adding new reservation:', err);
        return next(err);
      }

      res.status(201).send('Rezervacija uspješno dodana.');
    });
  });
});




router.post('/logout', function(req, res, next) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out. Please try again later.');
    }
    res.redirect('/');
  });
});

module.exports = router;


