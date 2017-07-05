const path = require('path');
const express = require('express');
const app = express();

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/game', express.static(path.join(__dirname, 'game')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(3000, function () {
    console.log('Serving on port 3000.')
});
