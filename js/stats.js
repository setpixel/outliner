;(function() {
  'use strict';

  var getCurrentNode = function() {
    var nodes = realtimeModel.outlineNodesAsArray();
    var currentNode = 0;
    for (var i = 0; i < outlinerApp.getCurrentSelection(); i++) {
      if (nodes[i].type != "section") {
        currentNode++;
      }
    }
    return currentNode+1;
  }

  var numberOfNodes = function() {
    var nodes = realtimeModel.outlineNodesAsArray();
    var numberOfNodes = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type != "section") {
        numberOfNodes++;
      }
    }
    return numberOfNodes; 
  }

  var updateStats = function() {
    var html = [];

    html.push( "Node " + getCurrentNode() + " of " + numberOfNodes());
    html.push( " // 15:12 / 90:13<br/>");
    html.push( "13 unique locations. 8 tags.");
    $("#stats").html(html.join(''));

    return html.join('');
  }

  window.stats = {
    numberOfNodes: numberOfNodes,
    updateStats: updateStats,
    twoplus: function() { return 2+2; }
  };

}).call(this);