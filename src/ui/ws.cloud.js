

// @format

(function() {
  var modal = ws.OverlayModal(document.body, {
    showOnInit: false,
    width: '90%',
    height: '90%'
  });

  ws.cloudUI = function() {
    modal.show();
  };
})();
