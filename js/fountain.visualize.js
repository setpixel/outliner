;(function() {
  
  var stats = {};
  var script = [];

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var loadURL = function (url) {
    // load fountain file
    var xmlhttp = new XMLHttpRequest();
    if (getParameterByName("script")) {
      xmlhttp.open("GET", "https://dl.dropboxusercontent.com/u/10266/scriptvisualizer2/data/" + getParameterByName("script") + ".fountain", false);
    } else {
      //xmlhttp.open("GET", "https://dl.dropboxusercontent.com/u/10266/scriptvisualizer2/data/" + url + ".fountain", false);
      xmlhttp.open("GET", "data/" + url + ".fountain", false);
    }
    xmlhttp.send();

    parseFountain(xmlhttp.responseText);
  };
      
  var parseFountain = function (fountainText) {
    var tokens = "";

    fountain.parse(fountainText, true, function (output) {
      tokens = output.tokens;
    });
    fountain.visualize.tokens = tokens;

    paginator(tokens);
    script = createScript(tokens);
    
    getUniqueLocations(script);

    outline = createOutline(script);
    
    characters = extractCharacters(script);


    wordCloud = createWordCloud(script);

    //html = renderScenes(outline, true);

    //$('body').append('<div style="position: fixed; left: 0; top: 0;">' + html + '</div>');

    //html = renderOutline(outline);
    //$('body').append(html);


        console.log(stats)
  };

  var paginator = function (tokens) {
    var currentPage = 0;
    var currentLine = 0;
    var currentCurs = 0;

    var reqLine = 0;
    var inDialogue = 0;

    for (var i=0; i<tokens.length; i++) {
      if (inDialogue == 0){ reqLine = 0 };

      switch (tokens[i].type) {
        case 'scene_heading': reqLine += 3; break;
        case 'action': reqLine += linesForText(tokens[i].text, 63)+1; break;
        case 'dialogue_begin': inDialogue = 1; break;
        case 'dual_dialogue_begin': inDialogue = 1; break;
        case 'character': reqLine += 1; break;
        case 'parenthetical': reqLine += 1; break;
        case 'dialogue': reqLine += linesForText(tokens[i].text, 35); break;
        case 'dialogue_end': reqLine += 1; inDialogue = 0; break;
        case 'dual_dialogue_end': reqLine += 1; inDialogue = 0; break;
        case 'centered': reqLine += 2; break;
        case 'transition': reqLine += 2; break; 
      }

      if (inDialogue == 0){
        if ((currentLine + reqLine) < 55) {
          currentLine = currentLine + reqLine;
          //console.log(tokens[i].text);
        } else {
          currentPage = currentPage + 1;
          currentLine = reqLine;
          switch (tokens[i].type) {
            case 'scene_heading': currentLine = currentLine - 1; break;
            case 'action': currentLine = currentLine - 1; break;
            case 'centered': currentLine = currentLine - 1; break;
            case 'transition': currentLine = currentLine - 1; break;
            case 'dialogue_end': currentLine = currentLine - 1; break;
            case 'dual_dialogue_end': currentLine = currentLine - 1; break;
          }
        }
      }

      tokens[i].page = currentPage+1;
    }
    fountain.visualize.stats['totalPages'] = currentPage+1;

  }

  //vPageCount = currentPage+1;

  //console.log("page count: " + vPageCount);
 
  function linesForText(text, charWidth) {
    var splitText = text.split(" ");
    var line = 0;
    var currentCurs = 0; 
    for (var i=0; i<splitText.length; i++) {
      if (splitText[i].indexOf("/>") != -1) {
        line = line + 1;
        currentCurs = splitText[i].length - 1;
      } else if (splitText[i].indexOf("<br") != -1) {
        currentCurs = 0;
      } else {
        if ((currentCurs + splitText[i].length) < charWidth){
          currentCurs = currentCurs + splitText[i].length + 1;
        } else {
          line = line + 1;
          currentCurs = splitText[i].length + 1;
        }
      }
    }
    return line+1;
  }

  function wordCount(text) {
    return text.split(" ").length;
  }
  
  function durationOfWords(text, durationPerWord) {
    return text.split(" ").length*durationPerWord;
  }



  var createScript = function (tokens) {
    var vScript = []
    var vCurrentTime = 0;
    var vCurrentCharacter = "";

    var sceneCounter = 0;


    for (var i=0; i<tokens.length; i++) {
      switch (tokens[i].type) {
        case 'title':
          var atom = {
            time: vCurrentTime,
            duration: 2000,
            type: 'title',
            text: tokens[i].text,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += 2000;
          vScript.push(atom);
          break;
        case 'scene_heading':
          sceneCounter++;
          duration = 2000;
           var atom = {
            time: vCurrentTime,
            duration: duration,
            type: 'scene_padding',
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += duration;
          vScript.push(atom);


          duration = 0;
          var atom = {
            time: vCurrentTime,
            duration: duration,
            type: 'scene_heading',
            text: tokens[i].text,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += duration;
          vScript.push(atom);
          break;
        case 'action':
          duration = durationOfWords(tokens[i].text, 200)+500;

          var atom = {
            time: vCurrentTime,
            duration: duration,
            type: 'action',
            text: tokens[i].text,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += duration;
          vScript.push(atom);
          break;
        case 'dialogue_begin': inDialogue = 1; break;
        case 'dual_dialogue_begin': inDialogue = 1; break;
        case 'character':
          vCurrentCharacter = tokens[i].text;
          break;
        case 'parenthetical':
          duration = durationOfWords(tokens[i].text, 300)+1000;

          var atom = {
            time: vCurrentTime,
            duration: duration,
            type: 'parenthetical',
            text: tokens[i].text,
            character: vCurrentCharacter,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += duration;
          vScript.push(atom);
          break;
        case 'dialogue':      
          duration = durationOfWords(tokens[i].text, 300)+1000;

          var atom = {
            time: vCurrentTime,
            duration: duration,
            type: 'dialogue',
            text: tokens[i].text,
            character: vCurrentCharacter,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += duration;
          vScript.push(atom);
          break;

        case 'dialogue_end': inDialogue = 0; break;
        case 'dual_dialogue_end': inDialogue = 0; break;
        case 'centered': break;
        case 'transition': break;
        case 'section':
          var atom = {
            time: vCurrentTime,
            duration: 0,
            type: 'section',
            text: tokens[i].text,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += 0;
          vScript.push(atom);
          break;
        case 'synopsis':
          var atom = {
            time: vCurrentTime,
            duration: 0,
            type: 'synopsis',
            text: tokens[i].text,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += 0;
          vScript.push(atom);
          break;
        case 'note':
          var atom = {
            time: vCurrentTime,
            duration: 0,
            type: 'note',
            text: tokens[i].text,
            scene: sceneCounter,
            page: tokens[i].page,
          }
          vCurrentTime += 0;
          vScript.push(atom);
          break;

      }

      
      //console.log(tokens[i]);

    }

    //script = vScript;
    this.fountain.visualize.script = vScript;
  
    this.fountain.visualize.stats['totalTime'] = vScript[vScript.length-1].time + vScript[vScript.length-1].duration;

    return vScript;
  }

 var extractCharacters = function(script) {

  tokens = script;

  // UNIQUE CHARACTERS

  vCharacters = {};
  vCharacterList = [];
  vCharacterListCount = [];
  vMainChars = []

  console.log(script)

  for (var i=0; i<tokens.length; i++) {
    if (tokens[i].type == "dialogue") {
      if (vCharacters.hasOwnProperty(tokens[i].character.split(" (")[0])) {
        vCharacters[tokens[i].character.split(" (")[0]] += 1;
      } else {
        vCharacters[tokens[i].character.split(" (")[0]] = 1;
        vCharacterList.push(tokens[i].character.split(" (")[0]);
      }
    }
  }



  for ( var key in vCharacters) {
    vCharacterListCount.push([key, vCharacters[key]])
  }
  vCharacterListCount.sort(function(a,b){return b[1]-a[1]})

  vMainChars.push(vCharacterListCount[0][0])
  vMainChars.push(vCharacterListCount[1][0])

  //console.log("total scenes: " + vSceneCount);
  console.log(vCharacterListCount);
  //console.log("pages per scene: " + (vPageCount / vSceneCount));


  var options = $('#characters');
  options.empty();
options.append($("<option />").val("").text("Everyone"));
  for (var i = 0; i < Math.min(vCharacterListCount.length,5); i++) {
    console.log(vCharacterListCount[i][0])
  options.append($("<option />").val(vCharacterListCount[i][0]).text(vCharacterListCount[i][0]));
}
  // $.each(result, function() {
  //     options.append($("<option />").val(this.ImageFolderID).text(this.Name));
  // });

}



  var createWordCloud = function(script) {

    wordCloud = {};



    for (var i=0; i<script.length; i++) {
      if (script[i].type == "dialogue" ) {
      //&& script[i].character == "ABE"

        if ($('#characters option:selected').val() !== "") {
          if (script[i].character == $('#characters option:selected').val()) {
        words = script[i].text.replace(/<br\s*[\/]?>/gi, " ").replace(/(<([^>]+)>)/ig, "").replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '').toLowerCase().split(" ")   
        for (var i2=0; i2<words.length; i2++) {
          if (typeof wordCloud[words[i2]] === "undefined"){
            wordCloud[words[i2]] = 1;
          } else {
            wordCloud[words[i2]]++;
          }
        }

          }
        } else {
        
        if ($('#filter option:selected').val() == "" || $('#filter option:selected').val() == "1"){
        words = script[i].text.replace(/<br\s*[\/]?>/gi, " ").replace(/(<([^>]+)>)/ig, "").replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '').toLowerCase().split(" ")   
        for (var i2=0; i2<words.length; i2++) {
          if (typeof wordCloud[words[i2]] === "undefined"){
            wordCloud[words[i2]] = 1;
          } else {
            wordCloud[words[i2]]++;
          }
        }
        
      }

        }

      }
       if ($('#characters option:selected').val() == "") {

        if ($('#filter option:selected').val() == "" || $('#filter option:selected').val() == "2"){

        if (script[i].type == "action") {
        words = script[i].text.replace(/<br\s*[\/]?>/gi, " ").replace(/(<([^>]+)>)/ig, "").replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '').toLowerCase().split(" ")   
        for (var i2=0; i2<words.length; i2++) {
          if (typeof wordCloud[words[i2]] === "undefined"){
            wordCloud[words[i2]] = 1;
          } else {
            wordCloud[words[i2]]++;
          }

        }
      }
    }

}

    }


    var blacklist = ['the', 'a', 'to', 'and', 'a', 'i', 'you', 'he', 'of'];

    var sortable = [];
    for (var i in wordCloud) {
      sortable.push([i, wordCloud[i]])
    }
    
    sortable.sort(function(a, b) {return b[1] - a[1]})

    words = []





    wordVolume = 0;

    visualWordList = []


    var count = 0;
 
    for (var i=0; i<sortable.length; i++) {
      
      if (blacklist.indexOf(sortable[i][0]) == -1){
        count++;
        visualWordList.push(sortable[i])
         wordVolume += sortable[i][1];
      }

      if (count > 2000) {
        break;
      }

     
    }
   
    console.log(wordVolume + ": " + visualWordList.length)



    for (var i=0; i<visualWordList.length; i++) {
      //console.log(sortable[i][0] + ": " + sortable[i][1]);
      //words.push([visualWordList[i][0], Math.sqrt(visualWordList[i][1])*(7000/wordVolume)*(wordVolume/visualWordList.length)*2]);
       words.push([visualWordList[i][0], Math.min(Math.sqrt(visualWordList[i][1])*(7000/wordVolume)*((wordVolume/visualWordList.length)*2),200)]);
    }

    console.log(visualWordList)
    //console.log(wordString);



    $('#my_canvas').empty();

    WordCloud(document.getElementById('my_canvas'), { list: words, fontWeight: 200, minRotation:0, maxRotation: 0, shuffle:false, shape:'star' } );

    wordString = []


    for (var i=0; i<sortable.length; i++) {
      if (sortable[i][0] !== ""){
         wordString.push("<div><div class='number'>" + sortable[i][1] + "</div><div class='word'>" + sortable[i][0] + "&nbsp;</div></div>");
  
      }
      }


     $('#wordcount').html(wordString.join(""));
     $('#wordcount').scrollTop(0);
  }


  var createOutline = function(script) {

    // time
    // dialogue lines
    // scene number
    // who is in the scene
    // color

    // page
    // time



    var sceneCount = 0;
    var recentSection = "";
    var recentSynopsis = "";
    var dialogueCount = 0;
    var timeMarkIn = 0;



    var outline = [];

    for (var i=0; i<script.length; i++) {
      if (script[i].type == "section") {
        recentSection = script[i].text;
      }
      if (script[i].type == "synopsis") {
        recentSynopsis = script[i].text;
      }
      if (script[i].type == "dialogue") {
        dialogueCount++;
      }
      if (script[i].type == "scene_heading") {

        if (outline.length > 0){
          outline[outline.length-1].dialogue = dialogueCount;
          outline[outline.length-1].duration = script[i].time - timeMarkIn;
        } 
        dialogueCount = 0;
        timeMarkIn = script[i].time;

        sceneAtom = {'slugline': script[i].text, 'title': recentSection, 'synopsis': recentSynopsis, 'dialogue': 0, 'duration': 0, 'page': script[i].page, 'time': script[i].time };
        outline.push(sceneAtom);



        sceneCount++;
        timeMarkIn = script[i].time;

        //console.log(script[i].text + " - " + recentSection);

        recentSection = recentSynopsis = "";
      }
    }

    outline[outline.length-1].dialogue = dialogueCount;
    outline[outline.length-1].duration = script[script.length-1].time - timeMarkIn;


    //console.log(outline);
    return outline;

  }


  var vColors = ["6dcff6", "f69679", "00bff3", "f26c4f", "fff799", "c4df9b", "f49ac1", "8393ca", "82ca9c", "f5989d", "605ca8", "a3d39c", "fbaf5d", "fff568", "3cb878", "fdc689", "5674b9", "8781bd", "7da7d9", "a186be", "acd373", "7accc8", "1cbbb4", "f9ad81", "bd8cbf", "7cc576", "f68e56", "448ccb"];

  var vTimeGradients = {
    "morning": "linear-gradient(rgba(213,243,255,0.8), rgba(109,207,246,0.7), rgba(100,100,255,0.0))",
    "day": "linear-gradient(rgba(144,224,255,0.7), rgba(100,100,255,0.0))",
    "afternoon": "linear-gradient(rgba(113,113,208,0.7), rgba(222,186,44,0.7), rgba(100,100,255,0.0))",
    "night": "linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.7), rgba(44,69,222,0.4))"};


  var vSceneListColors;

  var getUniqueLocations = function(script) {
    // UNIQUE LOCATIONS

    vScenes = {};
    vSceneList = [];
    vSceneCount = 0;
    vSceneListColors = {}

    vUniqueCount = 0;

    for (var i=0; i<script.length; i++) {
      if (script[i].type == "scene_heading") {
        vSceneCount++;
        if (vScenes.hasOwnProperty(script[i].text.split(" - ")[0])) {
          vScenes[script[i].text.split(" - ")[0]] += 1;
        } else {
          vUniqueCount++;
          vScenes[script[i].text.split(" - ")[0]] = 1;
          vSceneList.push(script[i].text.split(" - ")[0]);
          vSceneListColors[script[i].text.split(" - ")[0]] = {color: vColors[vUniqueCount % vColors.length]}
        }
      }
    }

    console.log(vSceneListColors);
    console.log(vSceneList);
    console.log(vScenes);


    console.log("total scenes: " + vSceneCount);
    console.log("unique locations: " + vSceneList.length);
    //console.log("pages per scene: " + (vPageCount / vSceneCount));


  }

  var renderScenes = function(outline, vertical) {
    var length;
    if (vertical == true) {
      length = $( window ).height();
    } else {
      length = $( window ).width();
    }

    var x = 0;

    var previousTime = 0;
    var previousColor = "000";

    var html = [];

    for (var i=0; i<outline.length; i++) {
      x++;
      if (vertical == true) {
        pos = Math.floor((outline[i].time/this.fountain.visualize.stats['totalTime'])*length);
        siz = Math.ceil((outline[i].duration/this.fountain.visualize.stats['totalTime'])*length);
        col = vSceneListColors[outline[i].slugline.split(" - ")[0]].color

        html.push("<div style='position: absolute; top: " + pos + "px; left: 0px; height: "+siz+"px; background-color: #" + col + "; width: 20px;'></div>")
          
      }
    }

    return html.join('');
  }


  var renderOutline = function(outline) {
    console.log(outline);

    html = [];

    console.log(vSceneListColors);






    for (var i=0; i<outline.length; i++) {

      color = "#" + vSceneListColors[outline[i].slugline.split(" - ")[0]].color;
      // switch (outline[i].slugline.split(" - ")[1]) {
      //     case 'EARLY EVENING':
      //     case 'DUSK':
      //     case 'AFTERNOON':
      //     case 'PRE-DAWN':
      //     case 'LATE AFTERNOON':
      //     case 'DAWN':
      //       shade = vTimeGradients["afternoon"];
      //       break;
      //     case 'EVENING':
      //     case 'NIGHT': 
      //     case 'LATE AT NIGHT':
      //       shade = vTimeGradients["night"];
      //       break;
      //     case 'MORNING':
      //       shade = vTimeGradients["morning"];
      //       break;
      //     case 'DAY':
      //     case 'DAYTIME':
      //       shade = vTimeGradients["day"];
      //       break;
      //   } 
 
      if (outline[i].slugline.split(".")[0] == "INT") {
        style = "border-left: 3px solid " + "#999" + ";";
        slugclass = "int"
      } else {
        style = "border-left: 3px dotted " + "#999" + ";";
        slugclass = "ext"
      }

       // 



      html.push('<div class="scene-card ' + slugclass + '" style="background: ' + color + '"><div class="abs"><div class="scene-card-shade" style="'+style+'"></div></div><div style="position: relative;"><div class="number">' + (i+1) + ' - </div><div class="slug">' + outline[i].slugline + ' </div><div class="title">' + outline[i].title + '&nbsp;</div><div class="synopsis">' + outline[i].synopsis + ' </div><div class="duration">' + renderTimeString(outline[i].duration) + '</div><div class="dialogue-count">lines: ' + outline[i].dialogue + '</div><div class="page">pg. ' + outline[i].page + '</div></div></div>')
    }


    return html.join('');
  }




  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }


  function renderTimeString(time, includeMS) {
    h = Math.floor(time/(60000*60));
    m = Math.floor(time/60000)-(h*60);
    s = Math.floor(time/1000)-(h*3600)-(m*60);
    ms = Math.floor(time/100)-(h*36000)-(m*600)-(s*10);
  
    if (h != 0){
      timeString = pad(h,1) + ":" + pad(m,2) + ":" + pad(s,2);
    } else {
      timeString = pad(m,2) + ":" + pad(s,2);
    }

    if (includeMS) {
      timeString = timeString + ":" + pad(ms,1);
    }

    return timeString;

  }


  this.fountain.visualize = parseFountain;
  this.fountain.visualize.loadURL = loadURL;
  this.fountain.visualize.createWordCloud = createWordCloud;
  this.fountain.visualize.stats = stats;
  //this.fountain.visualize.script = script;
   //fountain.visualize.x = 1;

 
  //console.log(loadFountain())


}).call(this);

