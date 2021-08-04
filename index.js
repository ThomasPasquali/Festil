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
    cookie: { maxAge: 1000*60*100 }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const PORT = 8888;
const db = new DB.Database(global.iniFile.db);

app.use(function(req, res, next){
    if(req.url != '/submit/auth' && !req.session.estochi)
        res.render('auth', { ok: (req.query.apposto?true:false) });
    else 
        next();
})

/*************TIMBRATURE***********/
app.get('/timbra', async function (req, res) {
    res.render('timbra', { dipendenti: await getDipendenti()});
});

/*************REPORT***********/
app.all('/report', async function (req, res) {
    let params = { dipendenti: await getDipendenti() };
    if(req.body.dipendente && req.body.da && req.body.a) {
        let ins = await db.query(
            'SELECT * FROM timbrature WHERE dipendente = ? AND data_ora >= ? AND DATE(DATE_ADD(data_ora, INTERVAL -1 DAY)) <= ? AND entrata = 1 ORDER BY data_ora ASC',
            [req.body.dipendente, req.body.da, req.body.a]);
        let outs = await db.query(
            'SELECT * FROM timbrature WHERE dipendente = ? AND data_ora >= ? AND DATE(DATE_ADD(data_ora, INTERVAL -1 DAY)) <= ? AND entrata = 0 ORDER BY data_ora ASC',
            [req.body.dipendente, req.body.da, req.body.a]);
        let timbrature = [];
        let tot = 0;
        let insI = 0, outsI = 0;
        console.log(ins, outs)
        
        try{
            while(ins[insI] && outs[outsI]){
                let en = new Date(ins[insI++].data_ora);
                let out = new Date(outs[outsI++].data_ora);
                let diff = out.getTime() - en.getTime();

                //console.log(en.getTime()+' '+out.getTime()+'  '+diff);
                
                timbrature.push({
                    data: Intl.DateTimeFormat('it', { year: 'numeric', month: 'numeric', day: 'numeric'}).format(en),
                    in: Intl.DateTimeFormat('it', {hour: 'numeric', minute: 'numeric'}).format(en),
                    out: Intl.DateTimeFormat('it', {hour: 'numeric', minute: 'numeric'}).format(out),
                    diff: msToHMS(diff)});
                tot += diff;
            }
        }catch(e) {
            params.error = e;
        }
        
        params.timbrature = timbrature
        params.risultati = res;
        params.da = req.body.da;
        params.a = req.body.a;
        params.tot = msToHMS(tot);
    }
    res.render('report', params);
});

/*************SUBMITS***********/
app.post('/submit/timbra', function (req, res) {
    db.query(
        'INSERT INTO timbrature (data_ora,dipendente,automatico,entrata) VALUES(?,?,?,?)',
        [req.body.timestamp, req.body.dipendente, req.body.automatico, req.body.entrata]
    ).then(() => { res.writeHead(302, {'Location': '/timbra'}); res.end(); });
});

app.post('/submit/auth', function (req, res) {
    if(req.body.password && bcrypt.compareSync(req.body.password, bcrypt.hashSync(iniFile.pw.timbra, 10)))
            req.session.estochi = 'luminario007';
    res.writeHead(302, {'Location': '/timbra'});
    res.end();
});

const server = app.listen(PORT);

/*************MISC***********/
function getDipendenti() {
    return db.query('SELECT *, IF((SELECT t.entrata FROM timbrature t WHERE t.dipendente = d.id ORDER BY t.data_ora DESC LIMIT 1) = 1, 0, 1) AS entrata FROM dipendenti d');
}

function msToHMS(ms) {
    let s = ms/1000;
    return parseInt(s/(60*60))+':'+parseInt((s%(60*60))/60);
}