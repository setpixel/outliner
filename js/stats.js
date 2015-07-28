;(function() {
  'use strict';

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

  window.stats = {
    numberOfNodes: numberOfNodes,
    twoplus: function() { return 2+2; }
  };

}).call(this);


