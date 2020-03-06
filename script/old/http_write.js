var http = require('http');

var url = 'http://fitnessexperience.it/hand-to-hand/write?servo=indice&angle=160';



http.get(url, function(res) {
    var body = '';

    res.on('data', function(chunk) {
        body += chunk;
    });

    res.on('end', function() {
        var data = JSON.parse(body)
        console.log("Risposta: ", data.response);
    });
}).on('error', function(e) {
      console.log("Got error: ", e);
});