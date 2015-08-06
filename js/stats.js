;(function() {
  'use strict';

  var currentNode;
  var totalNodes;

  var currentScene;
  var totalScenes;

  var currentTime;
  var totalTime;


  var generateStats = function() {
    var nodes = realtimeModel.outlineNodesAsArray();
    currentNode = 0;
    totalNodes = 0;
    currentScene = 0;
    totalScenes = 0;
    currentTime = 0;
    totalTime = 0;

    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type != "section") {
        totalNodes++;
      }
      if (nodes[i].type == "scene") {
        totalScenes++;
        totalTime += Number(nodes[i].duration);
      }

      if (i == outlinerApp.getCurrentSelection()) {
        currentNode = totalNodes;
        currentScene = totalScenes;
      }
      if (i == (outlinerApp.getCurrentSelection()-1)) {
        currentTime = totalTime;
      }
    }
  };

  var updateStats = function() {
    generateStats();

    var html = [];

    html.push( "Node " + currentNode + " of " + totalNodes );
    html.push( " | ");
    html.push( "Scene " + currentScene + " of " + totalScenes );
    html.push( " | ");
    html.push( currentTime.toHHMMSS() + " / " + totalTime.toHHMMSS());
    html.push( "<br/>");
    html.push( realtimeModel.getIndex('actors').propertyList.length + " characters. " + realtimeModel.getIndex('setting').propertyList.length + " locations. " + realtimeModel.getIndex('tags').propertyList.length + " tags.");
    $("#stats").html(html.join(''));

    return html.join('');
  }

  window.stats = {
    updateStats: updateStats,
    twoplus: function() { return 2+2; }
  };

}).call(this);