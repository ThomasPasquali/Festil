const http = require('http');
const express = require('express');
const session = require('express-session');
const path = require('path');
const Cookies = require('cookies');
const fs = require('fs');
const ini = require('ini');
global.iniFile = ini.parse(fs.readFileSync('./festil.ini', 'utf-8'));
global.timbratoreTokens = [];
const DB = require('./db.js');
const app = express();

app.use(express.urlencoded({ extended: true })) //Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()); //Parse JSON bodies (as sent by API clients)
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const PORT = 3000;
const SALT_ROUNDS = 3;
const db = new DB.Database(global.iniFile.db);

/*************HOME PAGE***********/
app.get('/timbra', async function (req, res) {
    //global.timbratoreTokens.push(+new Date());
    //console.log(global.timbratoreTokens);
    res.render('timbra', {dipendenti:await db.query('SELECT *, IF((SELECT t.entrata FROM timbrature t WHERE t.dipendente = d.id ORDER BY t.data_ora DESC LIMIT 1) = 1, 0, 1) AS entrata FROM dipendenti d')});
});

/*************SUBMITS***********/
app.post('/submit/timbra', function (req, res) {
    console.log(req.body)
    db.query(
        'INSERT INTO timbrature (data_ora,dipendente,automatico,entrata) VALUES(?,?,?,?)',
        [req.body.timestamp, req.body.dipendente, req.body.automatico, req.body.entrata]
    );
    res.writeHead(302, {'Location': '/timbra'});
    res.end();
});

const server = app.listen(PORT);