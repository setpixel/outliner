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

  var browserCheck = function () {
    if ((navigator.userAgent.indexOf("Chrome") != -1) || (navigator.userAgent.indexOf("Trident") != -1)) {

    } else {
      alert("Sorry, your browser doesn't work well with Outliner. I know this sucks. Please use Chrome.")
    }
  }

  window.outlinerUtils = {
  	stringToAscii: stringToAscii,
  	browserCheck: browserCheck
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

  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }

  Array.prototype.randomElement = function () {
    return this[Math.floor(Math.random() * this.length)]
  }

  Array.prototype.randomElementByPercentage = function (lowerBound, upperBound) {
    var floor = Math.max(Math.floor(lowerBound * this.length)-1,0);
    var ceil = Math.max(Math.floor(upperBound * this.length),0);


    return this[Math.floor(Math.random() * (ceil-floor))+floor]
  }



}).call(this);