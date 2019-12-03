

// @format

(function() {
  var events = ws.events();
  ws.on = events.on;
  ws.emit = events.emit;
})();
