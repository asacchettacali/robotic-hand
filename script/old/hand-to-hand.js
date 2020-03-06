// FUNZIONI GENERICHE
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};




// QUESTA FUNZIONE MI SERVE PER CALCOLARE L'ANGOLO COMPRESO FRA 2 VETTORI
var vectorAngle = function(v1,v2) {

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

// QUESTA FUNZIONE MI SERVE PER CALCOLARE L'ANGOLO SULL'ASSE Y DI UN DITO RISPETTO ALL'ASSE NORMALE DEL PALMO
var fingerAngleY = function(palmNormal, fingerDirection) {
	return vectorAngle(palmNormal, fingerDirection);
};

// QUESTA FUNZIONE RESETTA IL BUFFER DELLE DITA GIA' ASSEGNATE
var resetAssignedFingerBuffer = function(arrayLunghezzeToNomiDita, arrayLunghezzeToNomiDitaBuffer) {
  for (var key in arrayLunghezzeToNomiDita) {
    var baseAvaragesFingerLength  = arrayLunghezzeToNomiDita[key];
    var baseAvaragesFingerName    = key;
    arrayLunghezzeToNomiDitaBuffer[baseAvaragesFingerName] = baseAvaragesFingerLength;
  }
};



/******************************************************************************************************************************/
/******************************** PARTE RELATIVA IL COLLEGAMENTO DEL LEAP MOTION CON NODE.JS **********************************/
/******************************************************************************************************************************/

Leap = require("../lib/index");

var controller = new Leap.Controller()

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


/******************************************************************************************************************************/
/************************************* PARTE RELATIVA ALL'ARDUINO E AI SERVO MOTORI CONNESSI **********************************/
/******************************************************************************************************************************/


var five = require("johnny-five"), board, servo;

board = new five.Board();

  var dito = new Array();

function pugno(){
	dito['mignolo'].max();
	dito['anulare'].max();
	dito['medio'].max();
	dito['indice'].min();
	dito['pollice'].min();
}

function relax(){
	dito['mignolo'].min();
	dito['anulare'].min();
	dito['medio'].min();
	dito['indice'].max();
	dito['pollice'].max();
}


function fingerClose(servoFinger){
  
  if(servoFinger == 'pollice' || servoFinger == 'indice')
    dito[servoFinger].min();
  else
    dito[servoFinger].max();
  
}


board.on("ready", function() {

  // DEFINISCO TUTTI I SERVO MOTORI COLLEGATI ALL'ARDUINO SULLE RELATIVE PORTE DIGITALI PWM
  dito['mignolo'] = new five.Servo({
	pin: 3, // Servo 1
	range: [20, 160], // Default: 0-180
	type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
	startAt: 20, // if you would like the servo to immediately move to a degree
	center: false // overrides startAt if true and moves the servo to the center of the range
  });

  dito['anulare'] = new five.Servo({
    pin: 5, // Servo 3
    range: [20, 160], // Default: 0-180
    type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
    startAt: 20, // if you would like the servo to immediately move to a degree
    center: false // overrides startAt if true and moves the servo to the center of the range
  });

  dito['medio'] = new five.Servo({
    pin: 6, // Servo 5
    range: [20, 160], // Default: 0-180
    type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
    startAt: 20, // if you would like the servo to immediately move to a degree
    center: false // overrides startAt if true and moves the servo to the center of the range
  });

  dito['pollice'] = new five.Servo({
    pin: 9, // Servo 2
    range: [20, 160], // Default: 0-180
    type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
    startAt: 160, // if you would like the servo to immediately move to a degree
    center: false // overrides startAt if true and moves the servo to the center of the range
  });

  dito['indice'] = new five.Servo({
    pin: 10, // Servo 4
    range: [20, 160], // Default: 0-180
    type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
    startAt: 160, // if you would like the servo to immediately move to a degree
    center: false // overrides startAt if true and moves the servo to the center of the range
  });


  // VARIABILE CHE MI PERMETTE DI TENERE IL CONTO DEI FRAME ELABORATI DAL LEAP MOTION
  var contaFrame = 0;

  // VARIABILE CHE MI PERMETTE DI AVVIARE E INTERROMPERE LA CAMPIONATURA DELLE LUNGHEZZE DELLE DITA
  var campionaLunghezze = true;
  
  // QUESTA VARIABILE MI SERVE PER CAPIRE SE IL NUMERO DI DITA RISPETTO AL PRECEDENTE FRAME E' VARIATO. IN TAL CASO DEVO RESETTARE LA MEDIA DELLE LUNGHEZZE.
  var previousFigersNumber = 0;

  // DEFINISCO TUTTA UNA SERIE DI ARRAY CHE MI SERVIRANNO PER SVOLGERE DEI CALCOLI SU TUTTE LE DITA
  var arrayDitaOrdinata = new Array();
  var arrayLunghezzeToNomiDita = new Array();
  
  var arrayLunghezzeToNomiDitaBuffer = {};

  var arrayNomiDita = new Array();
  arrayNomiDita[0] = 'pollice';
  arrayNomiDita[1] = 'mignolo';
  arrayNomiDita[2] = 'indice';
  arrayNomiDita[3] = 'anulare';
  arrayNomiDita[4] = 'medio';

  var sommatoriaLunghezzaDito = new Array();
  sommatoriaLunghezzaDito[0] = 0;
  sommatoriaLunghezzaDito[1] = 0;
  sommatoriaLunghezzaDito[2] = 0;
  sommatoriaLunghezzaDito[3] = 0;
  sommatoriaLunghezzaDito[4] = 0;

  var mediaLunghezzaDito = new Array();
  mediaLunghezzaDito[0] = 0;
  mediaLunghezzaDito[1] = 0;
  mediaLunghezzaDito[2] = 0;
  mediaLunghezzaDito[3] = 0;
  mediaLunghezzaDito[4] = 0;

  // RECUPERO OGNI FRAME DEL LEAP MOTION
  controller.on("frame", function(frame) {

    // CONTATORE DI FRAME
    contaFrame++;    
    
    // NUMERO DI MANI VISIBILI DAL LEAP
    var nHands = frame.hands.length;

    // SE C'E' UNA SOLA MANO ALLORA POSSO CONTROLLARE LA MANO ARTIFICIALE
    if(nHands == 1){

      console.log("\n*********************** [FRAME "+contaFrame+"] **************************************");

      // PRENDO L'OGGETTO "HAND"
  		var hand = frame.hands[0];

      // ARCHIVIO IL NUMERO DI DITA RILEVATE PER QUESTO FRAME
      if(previousFigersNumber != hand.fingers.length){

        // DATO CHE CI SONO DITA DIVERSE RILEVATE DAL LEAP, DEVO RESETTARE LA MEDIA DELLE LUNGHEZZE
        sommatoriaLunghezzaDito[0] = 0;
        sommatoriaLunghezzaDito[1] = 0;
        sommatoriaLunghezzaDito[2] = 0;
        sommatoriaLunghezzaDito[3] = 0;
        sommatoriaLunghezzaDito[4] = 0;

        mediaLunghezzaDito[0] = 0;
        mediaLunghezzaDito[1] = 0;
        mediaLunghezzaDito[2] = 0;
        mediaLunghezzaDito[3] = 0;
        mediaLunghezzaDito[4] = 0;

        contaFrame = 0;

        // AVVISO PERCHE' E' UTILE
        // console.log("ATTENZIONE: E' VARIATO IL NUMERO DELLE DITA, MEDIA LUNGHEZZE RESETTATA");

        // AGGIORNO IL NUMERO DI DITA RILEVATE
        previousFigersNumber = hand.fingers.length;
      }


      // PRIMA DI LAVORARE SU OGNI DITO RESETTO L'ARRAY DOPPIA DI QUELLA CON NOMI-LUNGHEZZE DELLE DITA CHE VERRA' ESAURITA DURANTE LE ASSEGNAZIONI
      if(campionaLunghezze == false){
        for (var key in arrayLunghezzeToNomiDita) {
          var baseAvaragesFingerLength  = arrayLunghezzeToNomiDita[key];
          var baseAvaragesFingerName    = key;
          arrayLunghezzeToNomiDitaBuffer[baseAvaragesFingerName] = baseAvaragesFingerLength;
        }
      }
    

      // PER OGNI DITO RILEVATO DURANTE QUESTO FRAME
      for( var j = 0; j < hand.fingers.length; j++ ){



        // PRENDO L'OGGETTO "FINGER" J-ESIMO
        var finger = hand.fingers[j];

        

        // PRIMA DI TUTTO CAMPIONO LA LUNGHEZZA DI QUESTO J-ESIMO DITO PER STABILIRE MEDIAMENTE QUANTO E' LUNGO
        // SOMMO LA LUNGHEZZA DEL DITO J-ESIMO A QUELLA CAMPIONATA NEL PRECEDENTE FRAME
        sommatoriaLunghezzaDito[j] = parseInt(sommatoriaLunghezzaDito[j]) + parseInt(finger.length);

        // CALCOLO LA MEDIA DELLA LUNGHEZZA DI QUESTO J-ESIMO DITO CONSIDERANDO TUTTI I CAMPIONAMENTI FINO A QUESTO ISTANTE
        mediaLunghezzaDito[j] = (sommatoriaLunghezzaDito[j] / contaFrame).toFixed(2);

        // SE NON STO CAMPIONANDO LA LUNGHEZZA DELLE DITA PROCEDO
        if(campionaLunghezze == false){

          // PER SEMPLICITA' MI RIPORTO LA MEDIA DELLA LUNGHEZZA DEL DITO CORRENTE
          var currentFingerAvarageLength = mediaLunghezzaDito[j];

          // STABILISCO L'ANGOLO A CUI SI TROVA QUESTO J-ESIMO DITO RISPETTO AL PALMO DELLA MANO
          var fingerAngle = fingerAngleY(hand.palmNormal, finger.direction).toFixed(0);

          var x_direction = finger.direction[0].toFixed(2);
          var y_direction = finger.direction[1].toFixed(2);
          var z_direction = finger.direction[2].toFixed(2);
          var finger_id = finger.id
          

          console.log("\n=============> DITO "+j+" STATO: "+finger.Invalid);
          console.log("DIREZIONE X DITO: "+x_direction);
          console.log("POSIZIONE STABILIZED X: "+finger.stabilizedTipPosition[0].toFixed(0));

          console.log("ID: "+finger_id);
          console.log("ANGOLO DITO: "+fingerAngle);
          console.log("MEDIA LUNGHEZZA DITO: "+currentFingerAvarageLength);
          console.log("LUNGHEZZA DITO ISTANTANEA: "+finger.length);

          // ADESSO TRAMITE LA LUNGHEZZA MEDIA DEL DITO CORRENTE DEVO CAPIRE DI QUALE DITO SI TRATTA
          // PER QUESTO MOTIVO DEVO CONFRANTE TALE VALORE CON I VALORI DI CAMPIONATURA INIZIALE
          var FingerDelta = 999;
          for (var key in arrayLunghezzeToNomiDitaBuffer) {

            var baseAvaragesFingerLength  = arrayLunghezzeToNomiDitaBuffer[key];
            var baseAvaragesFingerName    = key;
            
            console.log("LUNGHEZZA MEDIA DI BASE DEL DITO "+baseAvaragesFingerName+": "+baseAvaragesFingerLength);

            // CALCOLO LA DIFFERENZA DELLE LUNGHEZZE MEDIE PER DETERMINARE DI CHE DITO SI TRATTA
            var lengthDiff = Math.abs(parseFloat(currentFingerAvarageLength) - parseFloat(baseAvaragesFingerLength));

            if(lengthDiff < FingerDelta){
              FingerDelta = lengthDiff;
              var detectedFingerName = baseAvaragesFingerName;
            }

          }

          // RIMUOVO IL DITO RILEVATO PER IMPEDIRNE UNA SUCCESSIVA ASSEGNAZIONE DOVUTA ALL'IMPRECISIONE DELLA LUNGHEZZA DELLE DITA
          console.log("DELTA: "+FingerDelta);
          delete arrayLunghezzeToNomiDitaBuffer[detectedFingerName];

          // STAMPO QUALE DITO E' STATO RILEVATO
          console.log("DITO RILEVATO: "+detectedFingerName);

          // DEVO EVITARE IL CASO DI DITO UNDEFINED ALTRIMENTI SI BLOCCA TUTTO!
          if(typeof detectedFingerName === "undefined"){
          
            // console.log('!!! DITO NON DEFINITO !!!');
          
          } else {

            // DEVO FARE ATTENZIONE PERCHE' I SERVO ATTACCATI A POLLICE E INDICE FUNZIONANO AL CONTRARIO DATA LA DISPOSIZIONE
            if(detectedFingerName == 'pollice' || detectedFingerName == 'indice')
              var servoAngle = (160-(100-fingerAngle)*2.5);
            else
              var servoAngle = (20+(100-fingerAngle))*2;

            // DEVO FARE ATTENZIONE PERCHE' IN OGNI CASO NON DEVO MAI FORNIRE AI SERVO UN ANGOLO FUORI DAL LORO RANGE DI LAVORO
            if(servoAngle < 20)
              servoAngle = 20;
            else if (servoAngle > 160)
              servoAngle = 160;

            // STAMPO QUALE DITO STO PER MUOVERE E QUALE ANGOLO STO PASSANDO AL SERVO MOTORE
            console.log('ANGOLO ASSEGNATO AL SERVO PER MUOVERE IL '+detectedFingerName+': '+servoAngle+'°');

            // MUOVO IL SERVO MOTORE RELATIVO AL DITO RILEVATO DELL'ANGOLAZIONE CALCOLATA
            // dito[detectedFingerName].to(servoAngle);
              
          } // CHIUSURA ELSE DITO RILEVATO
          
        } // CHIUSURA IF CAMPIONALUNGHEZZE == FALSE

      } // CHIUSURA FOR FINGERS



      // SE RIMANGONO DELLE DITA NON ASSEGNATE NELL'ARRAY DI BUFFER ALLORA LE INTERPRETO COME CHIUSE
      var fingerBufferSize = Object.size(arrayLunghezzeToNomiDitaBuffer);
      console.log('DITA NON ASSEGNATE: '+fingerBufferSize);

      if(fingerBufferSize > 0 && campionaLunghezze == false){

        for (var key in arrayLunghezzeToNomiDitaBuffer) {

          var remainingFingerLength  = arrayLunghezzeToNomiDitaBuffer[key];
          var remainingFingerName    = key;

          // fingerClose(remainingFingerName);

        }
      }
        

      


      // SE STO CAMPIONANDO
      if(campionaLunghezze == true){

        // PRENDO LE MEDIE DELLE LUNGHEZZE DELLE DITA E LE ORDINO DALLA PIU' PICCOLA ALLA PIU' GRANDE
        arrayDitaOrdinata = mediaLunghezzaDito.sort();

        // CHIARAMENTE LA LUNGHEZZA CON INDICE 0 SARA' IL POLLICE MENTRE LA LUNGHEZZA CON INDICE 4 SARA' IL DITO MEDIO
        for (var i = 0; i < arrayDitaOrdinata.length; i++) {

          // PRENDO IL NOME DEL DITO DALL'ARRAY CON TUTTI I NOMI ORDINATI DAL DITO PIU' PICCOLO A QUELLO PIU' GRANDE
          var nomeDito = arrayNomiDita[i];

          // PRENDO LA LUNGHEZZA MEDIA CORRENTE
          var lunghezzaDito = arrayDitaOrdinata[i];

          // COSTRUISCO UN ARRAY CHE CONTERRA' L'ASSOCIAZIONE "NOME DITO" => "LUNGHEZZA MEDIA"
          // QUANDO NON STARO' PIU' CAMPIONANDO QUESTA ARRAY RIMARRA' UN PUNTO DI RIFERIMENTO PER RICONOSCERE SUCCESSIVAMENTE LE DITA RILEVATE DAL LEAP
          arrayLunghezzeToNomiDita[nomeDito] = lunghezzaDito;
        }

      }

      console.log("\n");
      console.log(arrayLunghezzeToNomiDita);
      console.log('STATO DELLA CAMPIONATURA: '+campionaLunghezze);



    } else if(nHands == 2) {

      // SE IL LEAP RILEVA 2 MANI ALLORA INTERROMPE L'INIZIALE CAMPIONATURA DELLE LUNGHEZZE MEDIE DELLE DITA
      campionaLunghezze = false;
      
    } else {

      // SE IL LEAP NON RILEVA MANI ALLORA POSIZIONA LA MANO NELLO STATO DI RELAX
      // relax();
    }

    




  });

});


// COLLEGO IL LEAP MOTION 
controller.connect();


