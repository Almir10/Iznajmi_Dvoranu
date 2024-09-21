var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var mysql = require('mysql');
const bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var registrationRouter = require('./routes/registration');
var vlasnikRouter = require('./routes/vlasnikDashboard')
var adminRouter = require("./routes/adminDashboard")
var klijentRouter = require("./routes/klijentDashboard")

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Middleware za obradu JSON podataka
app.use(bodyParser.json());


// Database connection setup
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'abcd1234',
  database: 'iznajmljivanjedvoranadb'
});

app.use(session({
  secret: 'your-secret-key', // Change this to a random string
  resave: false,
  saveUninitialized: true
}));

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database!');
});



app.use((req, res, next) => {
  req.socket = connection;
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/registration', registrationRouter);
app.use("/vlasnikDashboard", vlasnikRouter);
app.use("/adminDashboard", adminRouter);
app.use("/klijentDashboard", klijentRouter);


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
