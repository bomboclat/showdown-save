var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('index.db');

app.set('view engine', 'ejs');
app.use('/files', express.static(__dirname + '/files/'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res){
  var error = req.query.err;
  if (error == "01") {
    res.sendFile(__dirname + '/static/login_error.html');
  }
  else{
    res.sendFile(__dirname + '/static/index.html');
  }
});


app.get('/home', function(req, res){
  var token_login = req.query.token;
  db.all('SELECT * FROM save WHERE token=?;',[token_login ] , function(err, table) {
    if(table !=""){
      db.get('SELECT save, user FROM save WHERE token=?;',[token_login ] , function(err, table) {
        res.render('home', {
          save: table["save"],
          user: table["user"],
          token: token_login
        });
      });
    }
    else{
      res.redirect("/?err=01");
    }
  });
});

app.get('/register', function(req, res){
  var error = req.query.err;
  if (error == "02") {
    res.sendFile(__dirname + '/static/register_error.html')
  }
  else if (error == "03") {
    res.sendFile(__dirname + '/static/register_exist.html');
  }
  else{
    res.sendFile(__dirname + '/static/register.html');
  }
});

app.get('/logout=true', function (req, res) {
  var token_logout = req.query.token;
  require('crypto').randomBytes(48, function(err, buffer) {
    var token_secure_out = buffer.toString('hex');
    db.run('UPDATE save SET token=?, token_expire=10000000000000000 WHERE token=?;',[token_secure_out, token_logout] , function(err) {
      if (err) return console.log(err);
      console.log('token removed!');
    });
  });
  res.redirect("/");
});

app.get('*', function(req, res){
  res.status(404).sendFile(__dirname + '/static/404.html');;
});

app.post('/', function (req, res) {
  var user = req.body.user;
  var pass = req.body.pass;
  db.all('SELECT * FROM save WHERE user=? AND pass=?;',[user, pass ] , function(err, table) {
    if(table !=""){
      require('crypto').randomBytes(48, function(err, buffer) {
        var token = buffer.toString('hex');
        var time = Date.now() / 1000 | 0;
        res.redirect("/home?token=" + token);
        db.run('UPDATE save SET token=?, token_expire=? WHERE user=? AND pass=?;',[token, time, user, pass ] , function(err) {
          if (err) return console.log(err);
          console.log('token posted!');
        });
      });
    }
    else{
      res.redirect("/?err=01");
    }
  });
});

app.post('/register', function (req, res) {
  var user = req.body.user;
  var pass = req.body.pass;
  if (user =='' || user == ' ' || pass =='' || pass == ' ') {
   res.redirect("/register?err=02");
 }
 else{
  db.all('SELECT * FROM save WHERE user=?;',[user] , function(err, table) {
    if(table !=""){
      res.redirect("/register?err=03");
    }
    else{
      require('crypto').randomBytes(48, function(err, buffer) {
        var token_register = buffer.toString('hex');
        var time_reg = Date.now() / 1000 | 0;
        db.run('INSERT INTO save VALUES (NULL, ?, ?, "Non hai caricato ancora nessun salvataggio!", ?, ?);',[user, pass, token_register, time_reg] , function(err) {
          if (err) return console.log(err);
          console.log('token posted!');
          res.redirect("/home?token=" + token_register);
        })
      });      
    }
  });
}
});

app.post('/home', function (req, res) {
  var token_login = req.query.token;
  db.all('SELECT * FROM save WHERE token=?;',[token_login ] , function(err, table) {
    if(table !=""){
      var text = req.body.text;
      if (text == '') {
        res.redirect("/home?token=" + token_login);
      }
      else{
        db.run('UPDATE save SET save=? WHERE token=?;',[text, token_login ] , function(err) {
          if (err) return console.log(err);
          console.log('ok!');
          res.redirect("/home?token=" + token_login);
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

app.listen(80, function () {
  console.log('listening on port 80!');
});

setInterval(function() { 
  var curtime =  Date.now() / 1000 | 0;
  db.each('SELECT token_expire FROM save;', function(err, table) {
    var db_time = table["token_expire"];
      var expire = curtime - db_time;
      if (expire >= 420) {
        require('crypto').randomBytes(48, function(err, buffer) {
          var token_secure_expire = buffer.toString('hex');
          db.run('UPDATE save SET token=?, token_expire=10000000000000000 WHERE token_expire=?;',[token_secure_expire, db_time] , function(err) {
            if (err) return console.log(err);
            console.log('token expired!');
          });
        });
      }
  });
}, 60000);

