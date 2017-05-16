;(function() {
  'use strict';

  var currentNode;
  var totalNodes;

  var currentScene;
  var totalScenes;

  var totalBeats;

  var currentTime;
  var totalTime;

  var totalCharacters;
  var totalLocations;
  var totalTags;

  var sectionStats;

  var tags;

  var generateStats = function() {
    var nodes = realtimeModel.outlineNodesAsArray();
    currentNode = 0;
    totalNodes = 0;
    currentScene = 0;
    totalScenes = 0;
    totalBeats = 0;
    currentTime = 0;
    totalTime = 0;
    sectionStats = [];
    tags = []

    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type != "section") {
        totalNodes++;
      } else {
        if (sectionStats.length > 0) {
          sectionStats.push([totalScenes, totalTime])
        } else {
          sectionStats.push([totalScenes, totalTime])
        }
      }
      if (i == (nodes.length-1)){
        sectionStats.push([totalScenes, totalTime]);
        sectionStats.shift();
        var tSectionStats = $.merge([], sectionStats);
        for (var i2 = 0; i2 < tSectionStats.length; i2++) {
          if (i2 > 0) {
            sectionStats[i2] = [tSectionStats[i2][0]-tSectionStats[i2-1][0],tSectionStats[i2][1]-tSectionStats[i2-1][1]] 
          }
        }
      }
      if (nodes[i].type == "scene") {
        totalScenes++;
        totalTime += Number(nodes[i].duration);
      }
      if (nodes[i].type == "beat") {
        totalBeats++;
      }
      if (i == outlinerApp.getCurrentSelection()) {
        currentNode = totalNodes;
        currentScene = totalScenes;
      }
      if (i == (outlinerApp.getCurrentSelection()-1)) {
        currentTime = totalTime;
      }
    }
    totalCharacters = realtimeModel.getIndex('actors').propertyList.length;
    totalLocations = realtimeModel.getIndex('setting').propertyList.length;
    totalTags = realtimeModel.getIndex('tags').propertyList.length;

    for (var key in realtimeModel.getIndex('tags').propertyElements) {
      tags.push([key, realtimeModel.getIndex('tags').propertyElements[key]]);
    }

    tags.sort(function(a,b){ return b[1].length - a[1].length; })
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
  };

  window.stats = {
    updateStats: updateStats,
    getStats: function() { return {
      "totalCharacters": totalCharacters,
      "totalLocations": totalLocations,
      "totalTags": totalTags,
      "totalNodes": totalNodes,
      "totalScenes": totalScenes,
      "totalBeats": totalBeats,
      "totalTime": totalTime,
      "sectionStats": sectionStats,
      "tags": tags
    } },
    twoplus: function() { return 2+2; }
  };

}).call(this);