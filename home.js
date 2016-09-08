var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('index.db');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(expressSession({ secret: 'keyboard cat', cookie: { maxAge: 1200000 }, resave: true, saveUninitialized: true }));
app.use('/files', express.static(__dirname + '/files/'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res){
    req.session.error = false;
    req.session.exist = false;
    res.sendFile(__dirname + '/static/index.html');
});

app.get('/login_error', function(req, res){
    if (req.session.login == true) {
      res.sendFile(__dirname + '/static/login_error.html');
    }
    else{
     res.redirect("/");
    }
  });

app.get('/home', function(req, res){
  var user = req.session.user;
  var pass = req.session.pass;
  db.all('SELECT * FROM save WHERE user=? AND pass=?;',[user, pass ] , function(err, table) {
  if(table !=""){
    db.get('SELECT save FROM save WHERE user=? AND pass=?;',[user, pass ] , function(err, table) {
      res.render('home', {
        save: table["save"],
        user: user
      });
    });
  }
  else{
    res.redirect("/login_error");
  }
  });
});

app.get('/register', function(req, res){

  if (req.session.error == true) {
    res.sendFile(__dirname + '/static/register_error.html');
    req.session.error == false;
  }
  else if (req.session.exist == true) {
    res.sendFile(__dirname + '/static/register_exist.html');
    req.session.exist == false;
  }
  else{
    res.sendFile(__dirname + '/static/register.html');
  }

});

app.get('/logout=true', function (req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.get('*', function(req, res){
res.status(404).sendFile(__dirname + '/static/404.html');;
});

app.post('/', function (req, res) {
  req.session.user = req.body.user;
  req.session.pass = req.body.pass;
  var user = req.session.user;
  var pass = req.session.pass;
  req.session.login = true;
  db.all('SELECT * FROM save WHERE user=? AND pass=?;',[user, pass ] , function(err, table) {
  if(table !=""){
    res.redirect("/home");
  }
  else{
    res.redirect("/login_error");
  }
  });
});

app.post('/login_error', function (req, res) {
  req.session.user = req.body.user;
  req.session.pass = req.body.pass;
  var user = req.session.user;
  var pass = req.session.pass;
  db.all('SELECT * FROM save WHERE user=? AND pass=?;',[user, pass ] , function(err, table) {
  if(table !=""){
    res.redirect("/home");
  }
  else{
    res.redirect("/login_error");
  }
  });
});

app.post('/register', function (req, res) {
    req.session.user = req.body.user;
    req.session.pass = req.body.pass;
    var user = req.session.user;
    var pass = req.session.pass;
    if (user =='' || user == ' ' || pass =='' || pass == ' ') {
       req.session.error = true;
       res.redirect("/register");
    }
    else{
    db.all('SELECT * FROM save WHERE user=?;',[user] , function(err, table) {
      if(table !=""){
        req.session.error = false;
        req.session.exist = true;
        res.redirect("/register");
      }
      else{
        db.run('INSERT INTO save VALUES (NULL, ?, ?, "Non hai caricato ancora nessun salvataggio!");',[user, pass ] );
        res.redirect("/home");
      }
    });
  }
});


app.post('/home', function (req, res) {
    var user = req.session.user;
    var pass = req.session.pass;
    db.all('SELECT * FROM save WHERE user=? AND pass=?;',[user, pass ] , function(err, table) {
      if(table !=""){
        var text = req.body.text;
        if (text == '') {
          res.redirect("/home");
        }
        else{
          db.run('UPDATE save SET save=? WHERE user=? AND pass=?;',[text, user, pass ] , function(err) {
            if (err) return console.log(err);
            console.log('ok!');
            res.redirect("/home");
          });
        }
      }
      else{
        res.redirect("/");
      }
    });
});

process.on('uncaughtException', function (err) {
  console.log(err);
});

app.listen(1993, function () {
  console.log('listening on port 1993!');
});

setInterval(function() { 
  console.log("setInterval: It's been one second!"); 
}, 1000);

