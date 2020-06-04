const http = require('http');
const express = require('express');
const session = require('express-session');
const path = require('path');
var bcrypt = require('bcrypt');
const fs = require('fs');
const ini = require('ini');
const pug = require('pug');
global.iniFile = ini.parse(fs.readFileSync('./festil.ini', 'utf-8'));
global.timbratoreTokens = [];
const DB = require('./db.js');
const app = express();

app.use(express.urlencoded({ extended: true })) //Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()); //Parse JSON bodies (as sent by API clients)
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'sesamo corrugato',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000*60*5 }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const PORT = 8888;
const db = new DB.Database(global.iniFile.db);

/*************HOME PAGE***********/
app.get('/timbra', async function (req, res) {
    if(req.session.estochi)
        res.render('timbra', { dipendenti: await db.query('SELECT *, IF((SELECT t.entrata FROM timbrature t WHERE t.dipendente = d.id ORDER BY t.data_ora DESC LIMIT 1) = 1, 0, 1) AS entrata FROM dipendenti d')});
    else
        res.render('timbraAuth', { ok: (req.query.apposto?true:false) });
});

/*************SUBMITS***********/
app.post('/submit/timbra', function (req, res) {
    if(req.session.estochi) {
        db.query(
            'INSERT INTO timbrature (data_ora,dipendente,automatico,entrata) VALUES(?,?,?,?)',
            [req.body.timestamp, req.body.dipendente, req.body.automatico, req.body.entrata]
        ).then(() => { 
            req.session.destroy();
            res.writeHead(302, {'Location': '/timbra?apposto=si'});
            res.end();
        });
    }else {
        res.writeHead(302, {'Location': '/timbra'});
        res.end();
    }
});

app.post('/submit/timbraAuth', function (req, res) {
    if( req.body.password &&
        bcrypt.compareSync(req.body.password, bcrypt.hashSync(iniFile.pw.timbra, 10)))
            req.session.estochi = 'luminario007';
    res.writeHead(302, {'Location': '/timbra'});
    res.end();
});

const server = app.listen(PORT);