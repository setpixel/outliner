/*

load image
perform quant
perform hue histogram




*/




;(function() {
  'use strict';

  var init = function () {
    var image = new Image();
    image.src = 'img/hIf9wqx8ltys5OWSnEIY85MBOPkKVlbs9MAddMjc5oc.png';
    document.body.appendChild(image);

    image.onload = function () {
      var opts = {
          colors: 100,        // desired palette size
          method: 2,          // histogram method, 2: min-population threshold within subregions; 1: global top-population
          boxSize: [16,16],   // subregion dims (if method = 2)
          boxPxls: 2,         // min-population threshold (if method = 2)
          initColors: 4096*12,   // # of top-occurring colors  to start with (if method = 1)
          minHueCols: 1,      // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
          dithKern: null,     // dithering kernel name, see available kernels in docs below
          dithSerp: false,    // enable serpentine pattern dithering
      };

      var q = new RgbQuant(opts);
      q.sample(image);
      var pal = q.palette();
      var out = q.reduce(image);

      var z = drawPixels(out, image.width)

      //document.body.appendChild(z);

      var context = z.getContext('2d');

      var hueColors = analyzeColor(context);
      


    }



  }



  var analyzeColor = function(imageContext) {
    var histogramSize = 20;

    var hHistogram, sHistogram, lHistogram;
    hHistogram = Array.apply(null, new Array(histogramSize)).map(function(){ return 0 });
    sHistogram = Array.apply(null, new Array(histogramSize)).map(function(){ return 0 });
    lHistogram = Array.apply(null, new Array(histogramSize)).map(function(){ return 0 });

    var hColors, sColors, lColors;
    hColors = Array.apply(null, new Array(histogramSize)).map(function(){ return {} });
    sColors = Array.apply(null, new Array(histogramSize)).map(function(){ return {} });
    lColors = Array.apply(null, new Array(histogramSize)).map(function(){ return {} });

    var data = imageContext.getImageData(0,0,imageContext.canvas.width, imageContext.canvas.height).data;

    for (var i = 0; i < data.length; i+=4 ) {
      var rgb = [data[i],data[i+1],data[i+2]];
      var hsl = rgbToHsl(rgb[0],rgb[1],rgb[2]);

      if (hsl[2] > 0.15 && hsl[1] > 0.1) {
        hHistogram[Math.ceil(hsl[0]*(histogramSize-1))] = ( hHistogram[Math.ceil(hsl[0]*(histogramSize-1))] || 0 ) + 1;
        hColors[Math.ceil(hsl[0]*(histogramSize-1))][rgb.toString()] = (hColors[Math.ceil(hsl[0]*(histogramSize-1))][rgb.toString()] || 0) + 1;
      }

      if (hsl[2] > 0.15) {
        sHistogram[Math.floor(hsl[1]*(histogramSize-1))] = ( sHistogram[Math.floor(hsl[1]*(histogramSize-1))] || 0 ) + 1;
        sColors[Math.floor(hsl[1]*(histogramSize-1))][rgb.toString()] = (sColors[Math.floor(hsl[1]*(histogramSize-1))][rgb.toString()] || 0) + 1;
      }

      lHistogram[Math.round(hsl[2]*(histogramSize-1))] = ( lHistogram[Math.round(hsl[2]*(histogramSize-1))] || 0 ) + 1;
      lColors[Math.round(hsl[2]*(histogramSize-1))][rgb.toString()] = (lColors[Math.round(hsl[2]*(histogramSize-1))][rgb.toString()] || 0) + 1;
    }

    
    var basicColors = [];
    // calculate basic colors
    // take the top 6 hue bands if available
    var sortedHues = [];
    for (var i = 0; i < hHistogram.length; i++ ) {
      sortedHues.push([i, hHistogram[i]]);
    }
    sortedHues.sort( function(a,b) { return b[1] - a[1]; });
    // top 3 are primary colors
    // take 4 evenly distributed colors or as many as you can
    var lastHueBand = -99;
    for (var i = 0; i < sortedHues.length; i++ ) {
      var sortedColors = [];
      for (var color in hColors[sortedHues[i][0]]) {
        var c = color.split(",");
        var hsl = rgbToHsl(Math.round(c[0]),Math.round(c[1]),Math.round(c[2]));
        sortedColors.push([c[0],c[1],c[2], hsl[0], hsl[1], hsl[2], hColors[sortedHues[i][0]][color]])
      }
      sortedColors.sort( function(a,b) { return a[5] - b[5]; });

      if (basicColors.length < 8) {
        if (basicColors.length < 4) {
          var colorSet = [];
          if (sortedColors.length > 3) {
            colorSet.push(sortedColors[0])
            colorSet.push(sortedColors[Math.round((sortedColors.length - 1)/3)])
            colorSet.push(sortedColors[Math.round((sortedColors.length - 1)/3*2)])
            colorSet.push(sortedColors[sortedColors.length - 1])
          } else {
            // for (var y = 0; y < sortedColors.length; y++ ) {
            //   colorSet.push(sortedColors[0]);
            // }
          }

          if ((colorSet.length > 2) ) { // && (Math.abs(sortedHues[i][0] - lastHueBand) > 1)
            lastHueBand = sortedHues[i][0];
            basicColors.push(colorSet)
          }
        } else {
          // the remaining 3 are accents
          // pick one hue strong color in the list         
          sortedColors.sort( function(a,b) { return b[4] - a[4]; });
          if (sortedColors.length > 2) {
            basicColors.push(sortedColors[0]);
          }
        }
      }
    }


      for (var i = 0; i < basicColors.length; i++ ) {
        $('body').append("<div></div>");
        if (basicColors[i].length < 5) {
          for (var i2 = 0; i2 < basicColors[i].length; i2++ ) {
            //console.log("<div style='background-color: rgb(" + basicColors[i][i2][0] + "," + basicColors[i][i2][1] + "," + basicColors[i][i2][2] + "); height: 20px; width: 20px; display: inline-block;'></div>")

            $('body').append("<div style='background-color: rgb(" + basicColors[i][i2][0] + "," + basicColors[i][i2][1] + "," + basicColors[i][i2][2] + "); height: 20px; width: 20px; display: inline-block;'></div>")
          }
        } else {
          $('body').append("<div style='background-color: rgb(" + basicColors[i][0] + "," + basicColors[i][1] + "," + basicColors[i][2] + "); height: 20px; width: 20px; display: inline-block;'></div>")
        }

        
      }
      $('body').append("<div></div>");



      //console.log(sortedColors)



    console.log(basicColors);
    






    document.body.appendChild(drawHistogram(hHistogram, hColors, 300, 200, 1));
    $('body').append(" ");
    document.body.appendChild(drawHistogram(sHistogram, sColors, 256, 200, 2));
    $('body').append(" ");
    document.body.appendChild(drawHistogram(lHistogram, lColors, 256, 200, 3));

    console.log(hHistogram)
    console.log(hColors)
    return hColors;
  };


  var drawHistogram = function(histogram, colors, width, height, gramType) {
    var can = document.createElement("canvas")
    can.width = width;
    can.height = height;
    var ctx = can.getContext("2d");

    var guideHeight = 5;


    ctx.beginPath();
    ctx.fillStyle="rgba(100,100,100,1)";

    ctx.fillRect(0,0,width,height);

    var maxAmount = Math.log(Math.max.apply(null, histogram)/100);
    ctx.closePath();

    for (var i = 0; i < histogram.length; i++ ) {



      // ctx.beginPath();
      // ctx.rect(Math.floor(i*(width/histogram.length)),(height-guideHeight)-Math.round(Math.log(histogram[i]/100)/maxAmount*(height-guideHeight)),Math.ceil(width/histogram.length),(height-guideHeight));
      // ctx.fill();
      // ctx.closePath();

      var totalHeight = Math.round(Math.log(histogram[i]/100)/maxAmount*(height-guideHeight));
      var lastTop = 0;

      var sortedColors = [];

      for (var color in colors[i]) {
        var c = color.split(",");
        var hsl = rgbToHsl(Math.round(c[0]),Math.round(c[1]),Math.round(c[2]));
        sortedColors.push([c[0],c[1],c[2], hsl[0], hsl[1], hsl[2], colors[i][color]])
      }


      switch (gramType) {
        case 1:
          sortedColors.sort( function(a,b) {
            // lightness
            return a[5] - b[5];
          });
          break;
        case 2:
          sortedColors.sort( function(a,b) {
            // lightness
            return a[5] - b[5];
          });
          break;
        case 3:
          sortedColors.sort( function(a,b) {
            // lightness
            return a[4] - b[4];
          });
          break;
      }
      
      for (var i2 = 0; i2 < sortedColors.length; i2++ ) {
        ctx.beginPath();
        var colorHeight = Math.round((sortedColors[i2][6]/histogram[i])*totalHeight)
        var c = color.split(",");
        var colorString = "rgb("+ Math.round(sortedColors[i2][0]) + "," + Math.round(sortedColors[i2][1]) + "," + Math.round(sortedColors[i2][2]) + ")";
        ctx.fillStyle = colorString
        ctx.fillRect(Math.floor(i*(width/histogram.length)),(height-guideHeight)-lastTop-colorHeight,Math.ceil(width/histogram.length),colorHeight);
        ctx.closePath();
        lastTop = lastTop + colorHeight;
      }      
    }

    for (var i = 0; i < histogram.length; i++ ) {
      
      var color; 

      switch (gramType) {
        case 1:
          color = hslToRgb((i/histogram.length), 1, 0.5);
          break;
        case 2:
          color = hslToRgb(0, (i/histogram.length), (i/histogram.length/2));
          break;
        case 3:
          color = hslToRgb(0, 0, (i/histogram.length));
          break;
      }

      var colorString = "rgba("+ Math.round(color[0]) + "," + Math.round(color[1]) + "," + Math.round(color[2]) + ", 1)";
      ctx.fillStyle = colorString

      ctx.beginPath();
      ctx.rect(Math.floor(i*(width/histogram.length)),(height-guideHeight),Math.ceil(width/histogram.length),(height));
      ctx.fill();
      ctx.closePath();
    }





    //console.log(histogram.length)
    return can;
  };




  init(); 
}).call(this);


function drawPixels(idxi8, width0, width1) {
  var idxi32 = new Uint32Array(idxi8.buffer);

  width1 = width1 || width0;

  var can = document.createElement("canvas"),
    can2 = document.createElement("canvas"),
    ctx = can.getContext("2d"),
    ctx2 = can2.getContext("2d");

  can.width = width0;
  can.height = Math.ceil(idxi32.length / width0);
  can2.width = width1;
  can2.height = Math.ceil(can.height * width1 / width0);

  ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = ctx.msImageSmoothingEnabled = false;
  ctx2.imageSmoothingEnabled = ctx2.mozImageSmoothingEnabled = ctx2.webkitImageSmoothingEnabled = ctx2.msImageSmoothingEnabled = false;

  var imgd = ctx.createImageData(can.width, can.height);

  if (typeOf(imgd.data) == "CanvasPixelArray") {
    var data = imgd.data;
    for (var i = 0, len = data.length; i < len; ++i)
      data[i] = idxi8[i];
  }
  else {
    var buf32 = new Uint32Array(imgd.data.buffer);
    buf32.set(idxi32);
  }

  ctx.putImageData(imgd, 0, 0);

  ctx2.drawImage(can, 0, 0, can2.width, can2.height);

  return can2;
}

function typeOf(val) {
  return Object.prototype.toString.call(val).slice(8,-1);
}