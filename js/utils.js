;(function() {
  'use strict';

  var baseColors = [
  	"E8255D", 
  	"D74498",
		"85549f",
		"3b56a2",
		"4889c5",
		"3cc5f1",
		"6ec5ae",
		"6bbc4c",
		"9eca46",
		"c5b93d",
		"f6a932",
		"e75f2f"
	];

	var colorList = [];

	var generateColors = function() {
		for (var i = 0; i < baseColors.length; i++) {
			colorList.push(tinycolor(baseColors[i]).toHexString());
			colorList.push(tinycolor(baseColors[i]).brighten(20).toHexString());
			colorList.push(tinycolor(baseColors[i]).brighten(30).toHexString());
			colorList.push(tinycolor(baseColors[i]).desaturate(15).toHexString());
		}
	}

	generateColors();

  var stringToAscii = function(string) {
  	var asciiSum = 0;

  	for (var i = 0; i < string.length; i++) {
  		asciiSum += string.charCodeAt(i);
		}

		return colorList[asciiSum % (colorList.length)];
  }

  window.outlinerUtils = {
  	stringToAscii: stringToAscii
  };

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
	}

  Number.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    var time = "";

    if (hours > 0) {
      if (hours   < 10) {hours   = "0"+hours;}
      time += hours + ":";
    }

    if (time != "") {
      if (minutes < 10) {minutes = "0"+minutes;}
    }
    if (seconds < 10) {seconds = "0"+seconds;}

    time += minutes+':'+seconds;
    return time;
  } 


}).call(this);