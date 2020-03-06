var handToHand = require('../../lib/handToHandRemote'),
	Leap = require("../../lib/index");


// ASSEGNO LA SENSIBILITA' CHE VOGLIO DARE AI SERVO MOTORI
servoSensibility = {'pollice': 20, 'indice': 7, 'medio': 2, 'anulare': 7, 'mignolo': 7};


// ASSEGNO IL CONTROLLER DEL LEAP
var controller = new Leap.Controller()

// OGGETTO CHE CONTERRA' L'ASSOCIAZIONE ID - SERVO
var idsToServos = {};

// OGGETTO CHE CONTERRA' L'ASSOCIAZIONE ID - POS X
var idsToStabilizedX = {};

// OGGETTO CHE CONTERRA' LE ULTIME POSIZIONI DEI SERVO
var oldServoAngles = {};

// ARRAY DEI SERVO MOTORI
var servoFinger = new Array();

// ASSEGNO LE FUNZIONI CHE POSSONO TORNARMI UTILI
handToHand = new handToHand();

/******************************************************************************************************************************/
/************************************* PARTE RELATIVA ALL'ARDUINO E AI SERVO MOTORI CONNESSI **********************************/
/******************************************************************************************************************************/

// RECUPERO OGNI FRAME DEL LEAP MOTION
controller.on('connect', function(){
	setInterval(function(){
	  var frame = controller.frame();

	   // NUMERO DI MANI VISIBILI DAL LEAP
    var nHands = frame.hands.length;

    // SE RILEVO SOLO 1 MANO
    if(nHands == 1){

    	// PRENDO L'OGGETTO "HAND"
		var hand = frame.hands[0];

		// PRENDO L'OGGETTO FINGER
		var finger_obj = hand.fingers;

		// TROVO IL NUMERO DELLE DITA RILEVATE
		detectedFingers = finger_obj.length;

		if(detectedFingers > 0){

			// SE L'OGGETTO ID-SERVO NON E' VALIDO DEVO PRIMA RIGENERARLO
			if(handToHand.checkIdsToServos(finger_obj, idsToServos) == false){

				// MI SERVONO TUTTE LE DITA PER RIGENERARE L'OGGETTO ID-SERVOS
				if(detectedFingers == 5){

					// SVUOTO PRIMA L'OGGETTO
				delete idsToServos;
				idsToServos = {};

				// RIGENERO L'OGGETTO ID-SERVO
				idsToServos = handToHand.refreshIdsToServos(finger_obj);

				/*
				for (var key in idsToServos) {

		          var nome_servo = idsToServos[key];
		          var id_leap = key;

		          console.log('ID: '+id_leap+', SERVO: '+nome_servo);

		        }
		        */

			} else
				console.log("Posizionare la mano APERTA per la calibrazione!");

			// SE L'OGGETTO ID-SERVO E' VALIDO PROSEGUO
			} else {

				// SE CI SONO MENO DI 5 DITA SIGNIFICA CHE DEVO TROVARE E CHIUDERE QUELLE ASSENTI
				if(detectedFingers < 5){
					
					// TROVO E CHIUDO LE DITA ASSENTI
					handToHand.closeAbsentFingers(finger_obj, idsToServos);

				}

				// PER OGNI DITO RILEVATO
				for( var j = 0; j < detectedFingers; j++ ){

					var this_finger = finger_obj[j];

		        	// RECUPERO L'ID DEL DITO
		        	var this_finger_id = this_finger.id;

		        	// RECUPER IL SERVO ASSOCIATO
		        	var servo = idsToServos[this_finger_id];

		        	// CALCOLO L'ANGOLO A CUI SI TROVA IL DITO RISPETTO ALLA NORMALE DEL PALMO
		        	var fingerAngle = handToHand.vectorAngle(hand.palmNormal, this_finger.direction).toFixed(0);

		      		handToHand.moveFingerTo(fingerAngle, servo, oldServoAngles, servoSensibility);
		      		
				}

			}

		} else {

			// CHIUDO LA MANO
			handToHand.punch(oldServoAngles);

			// SVUOTO L'OGGETTO ID-SERVOS
			delete idsToServos;
			idsToServos = {};
		}


    } else {
    	handToHand.relax();
    	console.log("Posizionare una mano...");
    }


	}, 10);
});



/******************************************************************************************************************************/
/******************************** PARTE RELATIVA IL COLLEGAMENTO DEL LEAP MOTION CON NODE.JS **********************************/
/******************************************************************************************************************************/

controller.on('ready', function() {
    console.log("Leap pronto...");
});

controller.on('disconnect', function() {
    console.log("Leap disconnesso...");
});

controller.on('deviceConnected', function() {
    console.log("Leap collegato...");
});

controller.on('deviceDisconnected', function() {
    console.log("Leap scollegato...");
});

// COLLEGO IL LEAP MOTION 
controller.connect();


