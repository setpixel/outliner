;(function() {
  'use strict';
 
  var utterance;
  window.speechSynthesis.getVoices();
	
	var currentNode = 0;
	var textToSpeak;

	var initUtterance = function() {
		utterance = new SpeechSynthesisUtterance();
		utterance.voice = window.speechSynthesis.getVoices()[1]; // Note: some voices don't support altering params
		utterance.voiceURI = 'native';
		utterance.volume = 0.7; // 0 to 1
		utterance.rate = 1.1; // 0.1 to 10
		utterance.pitch = 1; //0 to 2
		utterance.lang = 'en-US';		
	};

	var speakFromNode = function(nodeNumber) {
		speechBuffer = "";
		if (!utterance) { initUtterance(); }

		if (nodeNumber) {
			currentNode = nodeNumber;
		} else {
			currentNode = 0;
		}

		textToSpeak = [];

		var nodes = realtimeModel.outlineNodesAsArray();
    for (var i = 0; i < nodes.length; i++) {
    	var text = "";
    	if (nodes[i].title) {
    		text = nodes[i].title;
    		textToSpeak.push([i, text]);
    	}
    	if (nodes[i].synopsis) {
    		text = nodes[i].synopsis;
    		textToSpeak.push([i, text]);
    	}
    	
    }

		playNodeText(currentNode);
	};

	var utteranceNodeComplete = function(node) {
		if (textToSpeak.length > 0) {
			if (textToSpeak[currentNode][1].length > 0) {
				setTimeout(playNodeText, 10);
			} else {
				currentNode++;
				if (currentNode < textToSpeak.length) {
					outlinerApp.setSelectedItem(textToSpeak[currentNode][0]);
					outlinerApp.selectItem();
					setTimeout(playNodeText, 200);
				} else {
					//console.log("done speaking!")
				}
			}
		}
	};

	var playNodeText = function() {
		var txt = textToSpeak[currentNode][1];

    var chunkLength = 260;
    var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
    var chunkArr = txt.match(pattRegex);

    textToSpeak[currentNode][1] = textToSpeak[currentNode][1].replace(chunkArr[0], '');

 		utterance.text = chunkArr[0];
 		
 		speechSynthesis.speak(utterance);

 		utterance.onend = function(e) {
	 		utteranceNodeComplete();
		};
	};


	var speechBuffer = "";

	var speakText = function(text) {
		speechBuffer += text;
		speakSegment();
	};

	var speakSegment = function() {
    	if (speechSynthesis.speaking) {
    		return false;
    	}
    	if (!utterance) { initUtterance(); }
	    var chunkLength = 260;
	    var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
	    var chunkArr = speechBuffer.match(pattRegex);
		speechBuffer = speechBuffer.replace(chunkArr[0], '');
		utterance.text = chunkArr[0];
		speechSynthesis.speak(utterance);

 		utterance.onend = function(e) {
	 		utteranceSegmentComplete();
		};
	};

	var utteranceSegmentComplete = function(node) {
		if (speechBuffer.length > 0) {
			setTimeout(speakSegment, 0);
		}
	};

	var stop = function() {
		speechBuffer = "";
		textToSpeak = [];
		speechSynthesis.cancel();
	};

  window.speech = {
  	speakFromNode: speakFromNode,
  	speakText: speakText,
  	stop: stop,
  	playNodeText: playNodeText
  };

}).call(this);
