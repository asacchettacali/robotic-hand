/**
 * handToHand
 */
var handToHand = function() {

	var http = require('http');


	// QUESTA FUNZIONE MI CONSENTE DI LEGGERE L'ULTIMO SERVO-ANGOLO IN REMOTO
	var _remoteReadLastData = function(servoFinger) {		

		http.get('http://fitnessexperience.it/hand-to-hand/read', function(res) {
		    var body = '';

		    res.on('data', function(chunk) {
		        body += chunk;
		    });

		    res.on('end', function() {
		        var data = JSON.parse(body)


		        if(data.pollice.angle > 0)
		        	servoFinger['pollice'].to(data.pollice.angle);

		       	if(data.indice.angle > 0)
		        	servoFinger['indice'].to(data.indice.angle);

		        if(data.medio.angle > 0)
		        	servoFinger['medio'].to(data.medio.angle);

		        if(data.anulare.angle > 0)
		        	servoFinger['anulare'].to(data.anulare.angle);

		        if(data.mignolo.angle > 0)
		        	servoFinger['mignolo'].to(data.mignolo.angle);

		        console.log("--------------------------------");
		        console.log("Pollice: ", data.pollice.angle);
		        console.log("Indice: ", data.indice.angle);
		        console.log("Medio: ", data.medio.angle);
		        console.log("Anulare: ", data.anulare.angle);
		        console.log("Mignolo: ", data.mignolo.angle);

		    });
		}).on('error', function(e) {
		      return e;
		});

	};

	// QUESTA FUNZIONE MI CONSENTE DI SCRIVERE IN REMOTO I DATI DEL LEAP ELABORATI
	var _remoteWriteLastData = function(servo, angle) {		

		var url = 'http://fitnessexperience.it/hand-to-hand/write?servo='+servo+'&angle='+angle;

		http.get(url, function(res) {
		    var body = '';

		    res.on('data', function(chunk) {
		        body += chunk;
		    });

		    res.on('end', function() {
		        var data = JSON.parse(body)
		        var response = "SERVO: "+servo+" SALVATO NELL'ANGOLO: "+angle;

		        if(data.response == 0)
		        	response = "NON SALVATO";

		        console.log("Risposta: ", response);
		    });
		}).on('error', function(e) {
		      console.log("Errore: ", e);
		});

	};


	// QUESTA FUNZIONE MI SERVE PER CALCOLARE L'ANGOLO COMPRESO FRA 2 VETTORI
	var _vectorAngle = function(v1,v2) {

		var v1_x = v1[0];
		var v1_y = v1[1];
		var v1_z = v1[2];

		var v2_x = v2[0];
		var v2_y = v2[1];
		var v2_z = v2[2];

		var vectorProduct = v1_x*v2_x + v1_y*v2_y + v1_z*v2_z;
		var v1Norm = Math.sqrt(v1_x*v1_x+v1_y*v1_y+v1_z*v1_z);
		var v2Norm = Math.sqrt(v2_x*v2_x+v2_y*v2_y+v2_z*v2_z);
		var cos = Math.acos(vectorProduct/ (v1Norm*v2Norm));
		return cos * 180 / Math.PI;
	};

	// FUNZIONE CHE CONTROLLA LA VALIDITA' DELL'OGGETTO idsToServos
	var _checkIdsToServos = function(fingers, idsToServos) {

		// INIZIALMENTE IMPOSTIAMO IL RISCONTRO SU POSITIVO
		var check = true;

		for( var j = 0; j < fingers.length; j++ ){

	        // PRENDO IL J-ESIMO DITO
	        var finger = fingers[j];

	        // RECUPERO L'ID DEL DITO
	        var finger_id = finger.id;

	        // SE PER QUESTO ID NON ESISTE UN VALORE ALL'INTERNO DELL'OGGETTO ID-SERVO ALLORA FERMO IL CICLO E IMPOSTO IL RISCONTRO SU FALSE
	        if(typeof idsToServos[finger_id] === "undefined"){
	        	check = false;
	        	break;
	        }
    	}

    	return check;
	};


	// FUNZIONE CHE RIGENERA L'OGGETTO ID-SERVOS
	var _refreshIdsToServos = function(fingers) {

		var servosArray = new Array();
			servosArray[0] = 'pollice';
			servosArray[1] = 'indice';
			servosArray[2] = 'medio';
			servosArray[3] = 'anulare';
			servosArray[4] = 'mignolo';

		var idsToStabilizedX = {};
		var idsToServos = {};
		var sortable = [];


		for( var j = 0; j < fingers.length; j++ ){

	        // PRENDO IL J-ESIMO DITO
	        var finger = fingers[j];

	        // RECUPERO L'ID DEL DITO
	        var finger_id = finger.id;

	        var finger_stabilized_x_position = finger.stabilizedTipPosition[0].toFixed(0);

	        // E' IMPORTANTE USARE UN "OGGETTO" E NON UN "ARRAY" ANCHE SE COMPLICA DOPO IL SORTING PERCHE'
	        // USANDO UN ARRAY, SICCOME I FINGER ID POSSONO ESSERE VALORI ALTI, FANNO SALTARE L'INDEX DELL'ARRAY
	        // CREANDO UN ARRAY ENORME E INUTILE
	        idsToStabilizedX[finger_id] = finger_stabilized_x_position;

    	}

    	// PER ORDINARE L'OGGETTO ID-POS RIVERSIAMO TUTTO IN UN ARRAY E POI LO ORDINIAMO
		for (var id_finger in idsToStabilizedX)
			sortable.push([id_finger, idsToStabilizedX[id_finger]])
		
		sortable.sort(function(a, b) {return a[1] - b[1]})

		// ADESSO PRENDO L'ARRAY ORDINATO DI ID-POS E LO ELABORO PER GENERARE L'OGGETTO ID-SERVOS
		for (var i = 0; i < sortable.length; i++) {

			var this_finger_id = sortable[i][0];

			var this_finger_servo = servosArray[i];

			idsToServos[this_finger_id] = this_finger_servo;

			console.log('contatore: '+i+', NOME SERVO: '+this_finger_servo+', ID LEAP: '+this_finger_id+', POS_X: '+sortable[i][1]);
		};

		return idsToServos;
    	
	};

	var _closeAbsentFingers = function(fingers, idsToServos){

		var idsToServosBuffer = {};


		// CREO UN OGGETTO COPIA DA RIDURRE
		for (var key in idsToServos) {

          var nome_servo = idsToServos[key];
          var id_leap = key;

          idsToServosBuffer[id_leap] = nome_servo;

        }

        // ELIMINO LE DITA RILEVATE
		for( var j = 0; j < fingers.length; j++ ){

			// DEFINISCO L'OGGETTO FINGER CORRENTE
			var finger = fingers[j];

        	// RECUPERO L'ID DEL DITO
        	var finger_id = finger.id;

        	// STRIPPO LE DITA CHE CI SONO ANCORA LASCIANDO SOLO QUELLE CHIUSE
        	delete idsToServosBuffer[finger_id];
      		
		}

		// CHIUDO LE DITA RIMANENTI
		for (var key in idsToServosBuffer) {

          var nome_servo = idsToServosBuffer[key];
          var id_leap = key;

          _fingerOpen(nome_servo);

          // console.log('ID: '+id_leap+', SERVO: '+nome_servo);

        }

	}


	var _punch = function(oldServoAngles){

		// SE LA MANO NON E' GIA' A PUGNO
		if(oldServoAngles['pollice'] != 20 && oldServoAngles['indice'] != 20 &&
			oldServoAngles['medio'] != 160 && oldServoAngles['anulare'] != 160 && oldServoAngles['mignolo'] != 160){

			_remoteWriteLastData("mignolo", 160);
			_remoteWriteLastData("anulare", 160);
			_remoteWriteLastData("medio", 160);
			_remoteWriteLastData("indice", 20);
			_remoteWriteLastData("pollice", 20);

			oldServoAngles['mignolo'] = 160;
			oldServoAngles['anulare'] = 160;
			oldServoAngles['medio'] = 160;
			oldServoAngles['indice'] = 20;
			oldServoAngles['pollice'] = 20;

		}			
	}

	var _relax = function(oldServoAngles){

		// SE LA MANO NON E' GIA' A PUGNO
		if(oldServoAngles['pollice'] != 160 && oldServoAngles['indice'] != 160 &&
			oldServoAngles['medio'] != 20 && oldServoAngles['anulare'] != 20 && oldServoAngles['mignolo'] != 20){

			_remoteWriteLastData("mignolo", 20);
			_remoteWriteLastData("anulare", 20);
			_remoteWriteLastData("medio", 20);
			_remoteWriteLastData("indice", 160);
			_remoteWriteLastData("pollice", 160);

			oldServoAngles['mignolo'] = 20;
			oldServoAngles['anulare'] = 20;
			oldServoAngles['medio'] = 20;
			oldServoAngles['indice'] = 160;
			oldServoAngles['pollice'] = 160;

		}
	}

	var _fingerClose = function(selectedFinger){
	  if(selectedFinger == 'pollice' || selectedFinger == 'indice')
	    _remoteWriteLastData(selectedFinger, 20);
	  else
	    _remoteWriteLastData(selectedFinger, 160);
	}

	var _fingerOpen = function(selectedFinger){
	  if(selectedFinger == 'pollice' || selectedFinger == 'indice')
	    _remoteWriteLastData(selectedFinger, 160);
	  else
	    _remoteWriteLastData(selectedFinger, 20);
	}

	var _moveFingerTo = function(fingerAngle, servo, oldServoAngles, servoSensibility) {

		if(servo == 'pollice' || servo == 'indice')
          var servoAngle = (160-(100-fingerAngle)*2.5);
        else
          var servoAngle = (20+(100-fingerAngle)*1.5);

      	// DEVO FARE ATTENZIONE PERCHE' IN OGNI CASO NON DEVO MAI FORNIRE AI SERVO UN ANGOLO FUORI DAL LORO RANGE DI LAVORO
		if(servoAngle < 20)
			servoAngle = 20;
		else if (servoAngle > 160)
		  	servoAngle = 160;

	  	

		// ADESSO SE E' PRESENTE IL PRECEDENTE ANGOLO DEL SERVO MOTORE ALLORA
		// MUOVO IL SERVO SOLO SE IL DELTA RISPETTO LA VECCHIA POSIZIONE SUPERA
		// UNA CERTA SOGLIA DI SENSIBILITA'
		
		if(oldServoAngles[servo] > 0){

			var anglesDelta = Math.abs(parseInt(servoAngle)-parseInt(oldServoAngles[servo]));

			// console.log("DELTA ANGOLO PRECEDENTE: "+anglesDelta+'°');

			// SE IL DELTA FRA L'ANGOLO VECCHIO E QUELLO NUOVO E' MAGGIORE DELLA SENSIBILITA' IMPOSTATA ALLORA MUOVO IL SERVO ALTRIMENTI NO
			// INOLTRE AGGIORNO LA STORIA DELL'ANGOLO UTILIZZATO PER QUESTO SERVO MOTORE
			if(anglesDelta > servoSensibility[servo]){
				console.log("IL DITO "+servo+" SI TROVA A: "+fingerAngle+'°');
				console.log("IL DITO "+servo+" SI MUOVE VERSO: "+servoAngle+'°');
				oldServoAngles[servo] = servoAngle;
				_remoteWriteLastData(servo, servoAngle);
			}

		} else {
			console.log("IL DITO "+servo+" SI TROVA A: "+fingerAngle+'°');
			console.log("IL DITO "+servo+" SI MUOVE VERSO: "+servoAngle+'°');
			oldServoAngles[servo] = servoAngle;
			_remoteWriteLastData(servo, servoAngle);
		}

	}

	return {
		vectorAngle: _vectorAngle,
		checkIdsToServos: _checkIdsToServos,
		punch: _punch,
		relax: _relax,
		fingerClose: _fingerClose,
		fingerOpen: _fingerOpen,
		refreshIdsToServos: _refreshIdsToServos,
		closeAbsentFingers: _closeAbsentFingers,
		moveFingerTo: _moveFingerTo,
		remoteReadLastData: _remoteReadLastData
	};
};

module.exports = handToHand;
