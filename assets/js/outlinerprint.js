/*

  TODO
    footer:
      Title / credits / stats: 72 scenes. 8 locations. 12 characters.
    note indicator
    indicator for pivotal beats: BUT
    settings:
      page size
      include scenes?
      include beats?
      numbering?
      margins?
      color?


*/

window.PDFDocument = require('pdfkit');
var blobStream  = require('blob-stream');

;(function() {
  'use strict';
  var documentSize = [2*12*72,4*12*72];
  //var documentSize = [8.5*72,11*72];
	var fontData;
  var imageData;
  var imageAspectRatio;
  var currentTime;
  var currentSection;

  function convertImgToBase64(url, callback, outputFormat){
    // var destWidth = 400;
    // var destHeight = 200;

    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){

      var ratio = img.width / img.height;

      var destWidth = 600;
      var destHeight = destWidth / ratio;

      var canvas = document.createElement('CANVAS');
      canvas.width = destWidth;
      canvas.height = destHeight;

      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle="#FFFFFF";
      ctx.fillRect(0,0,destWidth,destHeight);
      ctx.drawImage(this,0,0, destWidth, destHeight);


      var imgdata = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = imgdata.data;

      for(var i = 0; i < data.length; i += 4) {
        var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        // red
        data[i] = brightness;
        // green
        data[i + 1] = brightness;
        // blue
        data[i + 2] = brightness;
      }
      // overwrite original image
      ctx.putImageData(imgdata, 0, 0);

      var dataURL = canvas.toDataURL("image/jpeg", 0.9);
      imageAspectRatio[url] = ratio;
      callback(dataURL);
      canvas = null; 
    };
    img.src = url;
  };

  var preloadImage = function(imageURL, callback) {
    convertImgToBase64(imageURL, function(url) {
      imageData[imageURL] = url;
      callback(url);
    })
  };

  var preloadImages = function(imageList, callback) {
    if (imageList.length == 0) { callback(); }
    var loadCount = imageList.length;
    for (var i = 0; i < imageList.length; i++) {
      preloadImage(imageList[i], function(url){
        loadCount--;
        console.log(loadCount + " images left to go")
        if (loadCount == 0) {
          //console.log("IM DONE LOADING YO");
          callback();
        }
      })
    }
  };

  var preloadFont = function(fontURL, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", fontURL, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function(oEvent) {
      fontData[fontURL] = oReq.response;
      callback(oReq.response);
    };
    oReq.send(null);
  };

  var preloadFonts = function(fontList, callback) {
    var loadCount = fontList.length;
    for (var i = 0; i < fontList.length; i++) {
      preloadFont(fontList[i], function(buffer){
        loadCount--;
        if (loadCount == 0) {
          //console.log("IM DONE LOADING FONTS YO");
          callback();
        }
      })
    }
  };

  var preloadAssets = function(imageList, fontList, callback) {
    //console.log("preloading assets");

    imageData = {};
    imageAspectRatio = {};
    fontData = {};

    preloadFonts(fontList, function(){
      console.log("fonts all loaded");
      preloadImages(imageList, function(){
        console.log("images all loaded");
        callback()
      })
    })
  };

  var printTest = function() {
    // size
    var margin = [22, 22, 22, 40];
    //var margin = [10, 10, 10, 800];
    currentTime = 0;
    currentSection = 0;

    // get assets
    var imageList = [];
    var nodes = realtimeModel.outlineNodesAsArray();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].imageURL) {
        imageList.push(nodes[i].imageURL);
      }
    }

    var fontList = [
      '/assets/fonts/proximanova/ProximaNova-Thin.ttf',
      '/assets/fonts/proximanova/ProximaNova-Light.ttf',
      '/assets/fonts/proximanova/ProximaNova-Reg.ttf',
      '/assets/fonts/proximanova/ProximaNova-Bold.ttf'
    ]

    // download images 
    // download fonts

    preloadAssets(imageList, fontList, function(){
      // console.log("done preloading!!!!");
      //console.log(imageData);
      //console.log(fontData);


      var doc = new PDFDocument({size: documentSize, layout: 'landscape', margin: 0});
      
      doc.registerFont('thin', fontData['/assets/fonts/proximanova/ProximaNova-Thin.ttf'])
      doc.registerFont('light', fontData['/assets/fonts/proximanova/ProximaNova-Light.ttf'])
      doc.registerFont('regular', fontData['/assets/fonts/proximanova/ProximaNova-Reg.ttf'])
      doc.registerFont('bold', fontData['/assets/fonts/proximanova/ProximaNova-Bold.ttf'])

      window.pdfdoc = doc;

      var stream = doc.pipe(blobStream());

      // get sizes on all nodes
      var nodeHeights = [];
      for (var i = 0; i < nodes.length; i++) {
        nodeHeights.push(renderNode(doc, nodes[i], 0, 0, 1).height);
      }      

      // reflow iteratively
      var scale = 0.001;
      var scaleTest = {leftMost: 0, scale: 0.001};

      for (var i = 0; i < 1000; i++) {
        var leftMost = flow(doc, nodes, nodeHeights, scale, margin).leftMost;

        if (leftMost < (doc.page.width-margin[1])) {
          if (leftMost > scaleTest.leftMost) {
            scaleTest.leftMost = leftMost;
            scaleTest.scale = scale;
          }
        }
        scale += (((doc.page.width-margin[1]) - leftMost)*.0001);
        console.log(scaleTest)
      }

      scale = scaleTest.scale;
      console.log(scale)


      flow(doc, nodes, nodeHeights, scale, margin, true);

      // add your content to the document here, as usual
      
      drawTags(doc, scale, margin);

      drawTimeline(doc, scale, margin);


      drawFooter(doc, scale, margin)

      // get a blob when you're done
      doc.end();
      stream.on('finish', function() {
        // get a blob you can do whatever you like with
        var blob = stream.toBlob('application/pdf');

        // or get a blob URL for display in the browser
        var url = stream.toBlobURL('application/pdf');
        console.log(url)
        window.open(url)
        //saveData(url, "test.pdf")
      });
    });
  };

  var drawTimeline = function(doc, scale, margin) {
    var timelineHeight = (360*scale);
    var yCursor = doc.page.height-timelineHeight-(80*scale)-margin[2];
    var xCursor = doc.page.width - (80*scale) - margin[1];
    // var yCursor = 100
    // var xCursor = 100

    doc.lineWidth(1*scale);
    doc.moveTo(xCursor+(5.5*scale), yCursor)
      .undash()
      .lineTo(xCursor+(5.5*scale), yCursor+timelineHeight)  
      .stroke()

    var totalTime = 0;
    var nodes = realtimeModel.outlineNodesAsArray();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type == 'scene') {
        if (nodes[i].duration) {
          totalTime += Number(nodes[i].duration);
        } else {
          totalTime += 90;
        }      
      }
    };

    // Draw Ticks
    doc.fillColor('black');
    for (var i = 0; i < Math.ceil((totalTime/60)/1); i++) {
      var tickY = yCursor+(timelineHeight/(totalTime/60)*(i * 1));
      doc.fillColor('#000');
      doc.font('regular');
      doc.moveTo(xCursor, tickY)
      doc.undash()
      if ((i % 15) == 0) {
        doc.lineWidth(0.5*scale);
        doc.fontSize(4*scale);
        doc.text((i * 1), xCursor+(10*scale), tickY-(4/1.7*scale), {width: 8.5*scale, align: 'left'})
        doc.lineTo(xCursor+(9*scale), tickY)  
          .stroke()
      } else {
        doc.lineWidth(0.1*scale);
        doc.fontSize(2*scale);
        if ((i % 5) == 0) {
          doc.lineWidth(0.25*scale);
          doc.text((i * 1), xCursor+(10*scale), tickY-(2/1.7*scale), {width: 8.5*scale, align: 'left'})
          doc.lineTo(xCursor+(8*scale), tickY)  
          .stroke()
        } else {
          doc.lineTo(xCursor+(6.5*scale), tickY)  
            .stroke()
        }
      }
    }

    var currentTime = 0;
    var currentScene = 0;

    var previousSection;
    var previousSectionCaption;

    // draw scenes and sections
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type == 'scene') {
        var duration = 0;
        currentScene++;
        if (nodes[i].duration) {
          duration = Number(nodes[i].duration);
          currentTime += duration;
        } else {
          duration = 90;
          currentTime += duration;
        }
        doc.rect(xCursor, yCursor+(((currentTime-duration)/totalTime)*timelineHeight), (5.5*scale), (((duration)/totalTime)*timelineHeight))     
        if (currentScene % 2) {
          doc.fill('#999');
        } else {
          doc.fill('#ccc');
        }
        doc.fillColor('#000');
        doc.font('regular');
        doc.fontSize(1.6*scale);
        doc.text(currentScene + ". " + nodes[i].title, xCursor+(17*scale), yCursor+(((currentTime-(duration*.8))/totalTime)*timelineHeight-((1)*scale)), {width: 100.5*scale, align: 'left'})
      } else if (nodes[i].type == 'section') {
        if (previousSection || (previousSection == 0)) {
          doc.rect(xCursor-(2.5*scale), yCursor+(((previousSection)/totalTime)*timelineHeight), (2.5*scale), (((currentTime - previousSection)/totalTime)*timelineHeight-(0.5*scale)))     
          doc.fill('#000');

          doc.save();
          doc.fontSize(5*scale);
          doc.font('bold');
          doc.rotate(90, {origin: [xCursor-(5*scale), yCursor+(((previousSection)/totalTime)*timelineHeight)]})
          if (doc.widthOfString(previousSectionCaption.toUpperCase()) > (((currentTime - previousSection)/totalTime)*timelineHeight-(0.5*scale)) ) {

          } else {
            doc.text(previousSectionCaption.toUpperCase(), xCursor-(5*scale), yCursor+(((previousSection)/totalTime)*timelineHeight - (0.5*scale)), {width: (((currentTime - previousSection)/totalTime)*timelineHeight-(0.5*scale)), align: 'left', ellipsis: true, lineBreak: false})
          }
          doc.restore();

        }

        previousSection = currentTime;
        previousSectionCaption = nodes[i].title;
      }
    };

    // draw end caps
    doc.moveTo(xCursor-(2.5*scale), yCursor);
    doc.lineWidth(0.7*scale);
    doc.lineTo(xCursor+(9*scale), yCursor) 
      .stroke();

    doc.moveTo(xCursor-(2.5*scale), yCursor+timelineHeight-(0.2*scale));
    doc.lineWidth(0.8*scale);
    doc.lineTo(xCursor+(9*scale), yCursor+timelineHeight-(0.2*scale))  
      .stroke();

    doc.fillColor('black');
  };

  var drawTags = function(doc, scale, margin) {
    var yCursor = doc.page.height-(stats.getStats().tags.length*5*scale)-(80*scale)-margin[2];
    var xCursor = doc.page.width - (145*scale) - margin[1];

    for (var i = 0; i < stats.getStats().tags.length; i++) {
      doc.font('thin');
      doc.fontSize(4*scale);
      doc.text(stats.getStats().tags[i][1].length + " x", xCursor, yCursor, {width: 8.5*scale, align: 'right'});
      doc.font('regular');
      doc.text(stats.getStats().tags[i][0].capitalize(), xCursor+(9.7*scale), yCursor, {width: 40*scale, align: 'left'});
      yCursor += (5*scale);
    }
  };

  var drawFooter = function(doc, scale, margin) {
    // draw svg
    doc.save();
    doc.translate(doc.page.width-(205*scale)-margin[1], doc.page.height-(49*scale)-margin[2])
    doc.scale(0.2*scale);
    doc.path("M73.4,63h29.8c3.5,0,5.7-3.8,3.9-6.8L78.6,6.7c-5.2-9-18.2-9-23.4,0l-7.1,12.4c-0.8,1.4-0.8,3.1,0,4.5l21.4,37.1 C70.3,62.2,71.8,63,73.4,63z").fill();
    doc.path("M115.6,75.4H73.4c-1.6,0-3.1,0.9-3.9,2.3l-14.7,25.5c-1.7,3,0.4,6.8,3.9,6.8h56.1c10.4,0,16.9-11.2,11.7-20.2l-6.9-12     C118.7,76.3,117.3,75.4,115.6,75.4z").fill();
    doc.path("M35.7,40.6L7.3,89.7c-5.2,9,1.3,20.2,11.7,20.2h15c1.6,0,3.1-0.9,3.9-2.3l20.9-36.2c0.8-1.4,0.8-3.1,0-4.5L43.5,40.6      C41.8,37.5,37.4,37.5,35.7,40.6z").fill();
    doc.path("M139.7,127.1h-0.8v2.1h-0.4v-2.1h-0.8v-0.3h2V127.1z M142.8,129.3h-0.4v-2.1h0l-0.8,2.1h-0.2l-0.8-2.1h0v2.1h-0.4v-2.5h0.6    l0.8,1.9l0.8-1.9h0.5V129.3z").fill();
    doc.path("M0,126.9h3.1l2.1,8.4h0l2.7-8.4h2.7l2.7,8.6h0l2.2-8.6h2.9l-3.8,13h-2.6l-2.9-9h0l-2.9,9H3.8L0,126.9z").fill();
    doc.path("M19,133.4c0-1,0.2-2,0.5-2.8s0.8-1.6,1.5-2.2s1.4-1.1,2.2-1.4c0.9-0.3,1.8-0.5,2.8-0.5c1,0,2,0.2,2.8,0.5    c0.9,0.3,1.6,0.8,2.2,1.4c0.6,0.6,1.1,1.3,1.5,2.2s0.5,1.8,0.5,2.8c0,1-0.2,2-0.5,2.8s-0.8,1.6-1.5,2.2c-0.6,0.6-1.4,1.1-2.2,1.4    c-0.9,0.3-1.8,0.5-2.8,0.5c-1,0-2-0.2-2.8-0.5c-0.9-0.3-1.6-0.8-2.2-1.4s-1.1-1.3-1.5-2.2S19,134.5,19,133.4z M22,133.4    c0,0.6,0.1,1.2,0.3,1.7c0.2,0.5,0.5,1,0.8,1.3c0.4,0.4,0.8,0.7,1.3,0.9c0.5,0.2,1.1,0.3,1.7,0.3c0.6,0,1.2-0.1,1.7-0.3    c0.5-0.2,0.9-0.5,1.3-0.9c0.4-0.4,0.6-0.8,0.8-1.3c0.2-0.5,0.3-1.1,0.3-1.7c0-0.6-0.1-1.2-0.3-1.7c-0.2-0.5-0.5-1-0.8-1.3    c-0.4-0.4-0.8-0.7-1.3-0.9c-0.5-0.2-1.1-0.3-1.7-0.3c-0.6,0-1.2,0.1-1.7,0.3c-0.5,0.2-0.9,0.5-1.3,0.9c-0.4,0.4-0.6,0.8-0.8,1.3    C22.1,132.3,22,132.8,22,133.4z").fill();
    doc.path("M35,126.9h3.9l5.5,9.1h0v-9.1h2.9v13h-3.8l-5.7-9.3h0v9.3H35V126.9z").fill();
    doc.path("M50,126.9h4.3c1,0,2,0.1,3,0.3c0.9,0.2,1.8,0.6,2.5,1.1c0.7,0.5,1.3,1.2,1.7,2c0.4,0.8,0.6,1.8,0.6,3c0,1.1-0.2,2-0.6,2.8    c-0.4,0.8-0.9,1.5-1.6,2c-0.7,0.5-1.5,1-2.3,1.2s-1.8,0.4-2.8,0.4H50V126.9z M52.9,137.3h1.5c0.7,0,1.3-0.1,1.8-0.2    s1.1-0.4,1.5-0.7s0.7-0.7,1-1.2s0.4-1.1,0.4-1.9c0-0.6-0.1-1.2-0.4-1.7c-0.2-0.5-0.6-0.9-1-1.2s-0.9-0.5-1.4-0.7s-1.1-0.2-1.7-0.2    h-1.7V137.3z").fill();
    doc.path("M64.1,126.9H73v2.6h-6v2.4h5.6v2.6H67v2.6h6.3v2.6h-9.2V126.9z").fill();
    doc.path("M75.6,126.9h5c0.7,0,1.3,0.1,1.9,0.2c0.6,0.1,1.1,0.3,1.6,0.6s0.8,0.7,1.1,1.2c0.3,0.5,0.4,1.1,0.4,1.9    c0,0.9-0.2,1.7-0.7,2.3c-0.5,0.6-1.2,1.1-2.1,1.2l3.3,5.5h-3.4l-2.7-5.2h-1.4v5.2h-2.9V126.9z M78.5,132.3h1.7c0.3,0,0.5,0,0.8,0    c0.3,0,0.5-0.1,0.8-0.2s0.4-0.2,0.6-0.4c0.2-0.2,0.2-0.5,0.2-0.8c0-0.3-0.1-0.6-0.2-0.8c-0.1-0.2-0.3-0.3-0.5-0.5    c-0.2-0.1-0.4-0.2-0.7-0.2c-0.3,0-0.5-0.1-0.8-0.1h-1.9V132.3z").fill();
    doc.path("M103.9,134.9c0,0.8-0.1,1.5-0.3,2.1s-0.6,1.2-1,1.7s-1,0.9-1.7,1.1c-0.7,0.3-1.5,0.4-2.4,0.4c-0.9,0-1.7-0.1-2.4-0.4    s-1.3-0.6-1.7-1.1s-0.8-1-1-1.7s-0.3-1.4-0.3-2.1v-8h2.9v7.9c0,0.4,0.1,0.8,0.2,1.1c0.1,0.3,0.3,0.6,0.5,0.9    c0.2,0.3,0.5,0.4,0.8,0.6c0.3,0.1,0.7,0.2,1.1,0.2c0.4,0,0.7-0.1,1-0.2c0.3-0.1,0.6-0.3,0.8-0.6c0.2-0.3,0.4-0.5,0.5-0.9    c0.1-0.3,0.2-0.7,0.2-1.1v-7.9h2.9V134.9z").fill();
    doc.path("M106.6,126.9h3.9l5.5,9.1h0v-9.1h2.9v13h-3.8l-5.7-9.3h0v9.3h-2.9V126.9z").fill();  
    doc.path("M121.5,126.9h2.9v13h-2.9V126.9z").fill();
    doc.path("M129.5,129.4h-3.7v-2.5h10.3v2.5h-3.7v10.5h-2.9V129.4z").fill();
    doc.restore();

    // text shit
    var yCursor = doc.page.height- (55*scale) - margin[2];
    var xCursor = doc.page.width - (160*scale) - margin[1];
    var savedYCusor;
    
    var text = realtimeModel.docTitle().toUpperCase();
    doc.font('bold');
    doc.fontSize(12*scale);
    doc.text(text, xCursor, yCursor, {width: 200*scale})
    yCursor += (12*scale);
    var text = "DRAFT: " + moment().format('MMMM Do, YYYY').toUpperCase();
    doc.font('regular');
    doc.fontSize(7*scale);
    doc.text(text, xCursor, yCursor, {width: 200*scale})
    yCursor += (10*scale);
    
    savedYCusor = yCursor;
    doc.font('regular');
    doc.fontSize(2*scale);
    doc.text("DIRECTOR", xCursor, yCursor, {width: 200*scale})
    yCursor += (2*scale);
    doc.font('bold');
    doc.fontSize(3*scale);
    doc.text("CHARLES FORMAN", xCursor, yCursor, {width: 200*scale})
    yCursor += (3*scale);

    yCursor = savedYCusor;
    doc.font('regular');
    doc.fontSize(2*scale);
    doc.text("STORY ARTIST", xCursor+(70*scale), yCursor, {width: 200*scale})
    yCursor += (2*scale);
    doc.font('bold');
    doc.fontSize(3*scale);
    doc.text("TAINO SOBA", xCursor+(70*scale), yCursor, {width: 200*scale})
    yCursor += (3*scale);

    yCursor += (6*scale);
    doc.lineWidth(1.3*scale);
    doc.moveTo(xCursor, yCursor).undash()
      .lineTo(xCursor+(150*scale), yCursor).stroke()
    yCursor += (6*scale);

    savedYCusor = yCursor;
    doc.font('regular');
    doc.fontSize(4*scale);
    doc.text("SCENES:", xCursor, yCursor, {width: 20*scale, align: 'right'})
    doc.text(stats.getStats().totalScenes, xCursor+(2*scale)+(20*scale), yCursor, {width: 20*scale, align: 'left'})
    yCursor += (5*scale);
    doc.text("BEATS:", xCursor, yCursor, {width: 20*scale, align: 'right'})
    doc.text(stats.getStats().totalBeats, xCursor+(2*scale)+(20*scale), yCursor, {width: 20*scale, align: 'left'})
    yCursor += (5*scale);
    doc.text("NODES:", xCursor, yCursor, {width: 20*scale, align: 'right'})
    doc.text(stats.getStats().totalNodes, xCursor+(2*scale)+(20*scale), yCursor, {width: 20*scale, align: 'left'})
    yCursor += (5*scale);

    yCursor = savedYCusor;
    doc.text("CHARACTERS:", xCursor+(40*scale), yCursor, {width: 30*scale, align: 'right'})
    doc.text(stats.getStats().totalCharacters, xCursor+(40*scale)+(2*scale)+(30*scale), yCursor, {width: 30*scale, align: 'left'})
    yCursor += (5*scale);
    doc.text("LOCATIONS:", xCursor+(40*scale), yCursor, {width: 30*scale, align: 'right'})
    doc.text(stats.getStats().totalLocations, xCursor+(40*scale)+(2*scale)+(30*scale), yCursor, {width: 30*scale, align: 'left'})
    yCursor += (5*scale);
    doc.text("TAGS:", xCursor+(40*scale), yCursor, {width: 30*scale, align: 'right'})
    doc.text(stats.getStats().totalTags, xCursor+(40*scale)+(2*scale)+(30*scale), yCursor, {width: 30*scale, align: 'left'})
    yCursor += (5*scale);

    yCursor = savedYCusor;
    doc.text("DURATION: " + msToTime(stats.getStats().totalTime*1000), xCursor+(95*scale), yCursor, {width: 30*scale, align: 'left'})
  };

  var flow = function(doc, nodes, nodeHeights, scale, margin, draw) {
    var cursorX = margin[3];
    var cursorY = margin[0];

    var sectionCount = 0;
    var sectionXY = [0,0];
    var sceneCount = 0;
    var beatCount = 0;

    for (var i = 0; i < nodeHeights.length; i++) {

      var drawDivider = true;

      if ((nodes[i].type == "section") && (i !== 0)) {
        cursorX += (140*scale);
        cursorY = margin[0]; 
        drawDivider = false;     
      }

      if ((nodes[i].type == "section") || (i == (nodeHeights.length-1))) {
        drawDivider = false; 

        if (draw) {
          if (sectionCount !== 0) {
            doc.lineWidth(2*scale);
            if (i != (nodeHeights.length-1)) {
              doc.moveTo(sectionXY[0], sectionXY[1])
                .undash()
                .lineTo(cursorX-(40*scale), sectionXY[1])  
                .stroke()
            } else {
              doc.moveTo(sectionXY[0], sectionXY[1])
                .undash()
                .lineTo(cursorX+(100*scale), sectionXY[1])  
                .stroke()
            }
          }          
        }
        sectionXY = [cursorX, cursorY + (10*scale)];
        sectionCount++;    
      }

      if ((nodes[i].type == "scene") && (i !== 0)) {
        sceneCount++;
      }

      if ((nodes[i].type == "beat") && (i !== 0)) {
        beatCount++;
      }

      if (nodes[Math.min(i+1, nodeHeights.length-1)].type == "section") {
        drawDivider = false;
      }

      if ((cursorY + (nodeHeights[i]*scale)) > (doc.page.height-margin[2]) ) {
        cursorX += (120*scale);
        cursorY = margin[0] + (19*scale);
      }

      if (draw) {
        renderNode(doc, nodes[i], cursorX, cursorY, scale, true, sceneCount, beatCount);
      }
 
      cursorY += (nodeHeights[i]*scale) + (10*scale);

      if (draw && drawDivider) {
        if (nodes[Math.min(i+1, nodeHeights.length-1)].type == "scene") {
          doc.lineWidth(1*scale)
            .undash();
        } else {
          doc.lineWidth(0.25*scale)
            .dash(0.5*scale, {space: 1*scale});
        }
        doc.moveTo(cursorX, cursorY - (5*scale))
          .lineTo(cursorX+(100*scale), cursorY - (5*scale))  
          .stroke()
      }
    }

    return {leftMost: cursorX + (100*scale)};
  };

  var renderNode = function(doc, node, x, y, scale, draw, sceneCount, beatCount) {
    var height = y;

    switch (node.type) {
      case "section":
        var text = node.title.toUpperCase();
        doc.font('bold');
        doc.fontSize(6*scale);
        if (draw) {
          doc.text(text, x, y, {width: 140*scale, lineBreak: false, ellipsis: true, height: (6*scale) })
          var tWidth = (doc.widthOfString(text, {width: 140*scale, lineBreak: false, ellipsis: true, height: (6*scale) }))
          if (stats.getStats().sectionStats[currentSection][0] > 0) {
            doc.font('thin');
            var text2 = stats.getStats().sectionStats[currentSection][0] + " SCENES / ";
            if (stats.getStats().sectionStats[currentSection][1] > 0) {
              text2 += Math.round(stats.getStats().sectionStats[currentSection][1]/60) + " MINS";
            } else {
              text2 += "•";
            }
            doc.text(text2, x + tWidth + (2.5*scale), y, {width: 140*scale, lineBreak: false, ellipsis: true, height: (6*scale) })
          }
          currentSection++;
        }
        height += doc.heightOfString(text, {width: 140*scale, lineBreak: false, ellipsis: true, height: (6*scale) });
        height += (0*scale);
        break;
      case "scene":
        doc.font('light');
        doc.fontSize(4*scale);
        if (node.setting || node.timeOfDay) {
          if (draw && node.setting) {
            doc.text(node.setting.toUpperCase(), x, height, {width: 100*scale});
          }
          if (draw && node.timeOfDay) {
            doc.text(node.timeOfDay.toUpperCase(), x, height, {width: 100*scale, align: 'right'});
          }
          height += doc.heightOfString("ASDAD", {width: 100*scale});
          height -= (1.5*scale);
        }

        doc.lineWidth(1*scale)
        doc.lineJoin('round')
        
        var checkBoxes = true;
        if (!checkBoxes) {
          doc.rect(x-(8*scale), height+(3*scale), (5.5*scale), (10*scale))
         .fillAndStroke("#000","#000")
        } else {
          doc.rect(x-(8*scale), height+(3*scale), (5.5*scale), (20*scale))
          .fillAndStroke("#000","#000")
          doc.lineWidth(0.6*scale)
          //.rect(x-(8*scale), height+(3*scale), (5.5*scale), (10*scale))
          .rect(x-(6.5*scale), height+(14.5*scale), (2.5*scale), (2.5*scale))
          .fillAndStroke("#fff","#fff")
          .rect(x-(6.5*scale), height+(19*scale), (2.5*scale), (2.5*scale))
          .fillAndStroke("#fff","#fff")
        }

        doc.lineWidth(0.1*scale)
          .dash(0.25*scale, {space: 0.25*scale});
        doc.moveTo(x-(8*scale), height+(8.0*scale))
          .lineTo(x-(8*scale)+(5.5*scale), height + (8.0*scale))  
          .stroke('white')
          .undash()
          .strokeColor('black');

        doc.fillColor('white');
        doc.font('bold');
        doc.fontSize(4*scale);
        if (draw) {
          doc.text(sceneCount.toString(), x-(8*scale), height+(2.9*scale), {width: (5.5*scale), align: 'center'});
        }
        doc.font('regular');
        if (node.duration) {
          doc.fontSize(2*scale);
          if (draw) {
            doc.text(sToMmss(currentTime), x-(8.5*scale), height+(8.5*scale), {width: (6.5*scale), align: 'center'});
          }
          doc.fontSize(2*scale);
          if (draw) {
            doc.text("+" + sToMmss(node.duration) + " ", x-(8.5*scale), height+(10.5*scale), {width: (6.5*scale), align: 'center'});
          }
          doc.fillColor('black');
        } else {
          doc.fontSize(2*scale);
          if (draw) {
            doc.text("•", x-(8*scale), height+(9.5*scale), {width: (5.5*scale), align: 'center'});
          }
          doc.fillColor('black');
        }

        if (draw) {
          currentTime += Number(node.duration);
          //console.log(currentTime);
        }
        var text = node.title;
        doc.font('bold');
        doc.fontSize(10*scale);
        if (draw) {
          doc.text(text, x, height, {width: 100*scale, lineGap: -2*scale})
        }
        height += doc.heightOfString(text, {width: 100*scale, lineGap: -2*scale});

        if (node.imageURL) {
          height += (4.5*scale);
          var imgw = 100;
          var imgh = 100 / imageAspectRatio[node.imageURL];          
          if (draw) {
            doc.image(imageData[node.imageURL], x, height, {width: (imgw*scale), height: (imgh * scale)})        
            doc.lineWidth(0.15*scale).undash();
            doc.rect(x, height, (imgw*scale), (imgh * scale))
            doc.stroke()
          }
          height += (imgh * scale) + (2*scale);
        } else {
          height += (4.5*scale);
          var imgw = 100;
          var imgh = 100 / (3196/1360);          
          if (draw) {
            doc.lineWidth(0.15*scale).undash();
            doc.rect(x, height, (imgw*scale), (imgh * scale))
            doc.stroke()
          }
          height += (imgh * scale) + (2*scale);
        }
        if (node.synopsis) {
          height += (2.5*scale);
          doc.font('thin');
          doc.fontSize(3*scale);
          if (draw) {
            //doc.text(node.synopsis, x, height, {width: 100*scale, lineGap: 0*scale, height: 20*scale, ellipsis: true})
            doc.text(node.synopsis, x, height, {width: 100*scale, lineGap: 0*scale, ellipsis: true})
          }
          //height += Math.min(doc.heightOfString(node.synopsis, {width: 100*scale, lineGap: 0*scale, height: 20*scale, ellipsis: true}), 20*scale);          
          height += doc.heightOfString(node.synopsis, {width: 100*scale, lineGap: 0*scale, ellipsis: true});          
        }
        break;
      case "beat":

        doc.font('thin');
        doc.fontSize(2*scale);

        if (draw) {
          doc.text(beatCount.toString() + ". ", x-(12*scale), height+(3*scale), {width: 11*scale, align: 'right'})
        }

        if (node.imageURL) {
          var imgw = 100;
          var imgh = 100 / imageAspectRatio[node.imageURL];          
          if (draw) {
            doc.image(imageData[node.imageURL], x, height, {width: (imgw*scale), height: (imgh * scale)})        
            doc.lineWidth(0.15*scale).undash();
            doc.rect(x, height, (imgw*scale), (imgh * scale))
            doc.stroke()
          }
          height += (imgh * scale) + (2*scale);
        }

        var text = node.title;
        doc.font('bold');
        doc.fontSize(6*scale);
        if (draw) {
          doc.text(text, x, height, {width: 100*scale, lineGap: -1*scale})
        }
        height += doc.heightOfString(text, {width: 100*scale, lineGap: -1*scale});

        if (node.synopsis) {
          height += (2.5*scale);
          doc.font('thin');
          doc.fontSize(5*scale);
          if (draw) {
            doc.text(node.synopsis, x, height, {width: 100*scale, lineGap: 0*scale, height: 20*scale, ellipsis: true})
          }
          height += Math.min(doc.heightOfString(node.synopsis, {width: 100*scale, lineGap: 0*scale, height: 20*scale, ellipsis: true}), 20*scale);          
        }
        break;
      case "note":
        var text = node.title;
        doc.font('light');
        doc.fontSize(5*scale);
        if (draw) {
          doc.text(text, x, height, {width: 100*scale})
        
          doc.save();

          var noteHeight = doc.heightOfString(text, {width: 100*scale});

          doc.rect(x-(4*scale), height, (1*scale), noteHeight)
            .clip()
          doc.lineWidth(50*scale)
            .dash(1*scale, {space: 1*scale});
          doc.moveTo(x-(4*scale), height)
            .lineTo(x-(4*scale)+ (20*scale), height + (20*scale))  
            .stroke("#ccc")
            .clip()
          doc.restore();
        }
        height += doc.heightOfString(text, {width: 100*scale});
        break;
      default:
        height += (100*scale)
    }
    return {height: height};
  }

  var sToMmss = function(totalSeconds) {
    var minutes = Math.floor((totalSeconds) / 60);
    var seconds = totalSeconds - (minutes * 60);
    // round seconds
    seconds = Math.round(seconds * 100) / 100
    var result = minutes;
        result += ":" + (seconds  < 10 ? "0" + seconds : seconds);
    return result;
  }

  function msToTime(s) {
    function addZ(n) {
      return (n<10? '0':'') + n;
    }
    var ms = (s % 1000);
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    if (hrs) {
      return hrs + ':' + addZ(mins);
    } else {
      return mins + ':' + addZ(secs); //+ '.' + ms.toString().substring(0,1);
    }
  }

  window.outlinerPrint = {
    printTest: printTest
  };

}).call(this);