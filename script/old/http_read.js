var http = require('http');

var url = 'http://fitnessexperience.it/hand-to-hand/read';



setInterval(function(){

	http.get(url, function(res) {
	    var body = '';

	    res.on('data', function(chunk) {
	        body += chunk;
	    });

	    res.on('end', function() {
	        var data = JSON.parse(body)
	        console.log("--------------------------------");
	        console.log("Pollice: ", data.pollice.angle);
	        console.log("Indice: ", data.indice.angle);
	        console.log("Medio: ", data.medio.angle);
	        console.log("Anulare: ", data.anulare.angle);
	        console.log("Mignolo: ", data.mignolo.angle);
	    });
	}).on('error', function(e) {
	      console.log("Got error: ", e);
	});

},100); 

	