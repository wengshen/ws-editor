

// @format

(function() {
  var modal = ws.OverlayModal(false, {
    showOnInit: false,
    zIndex: 11000,
    width: 300,
    height: 400
  });

  ws.dom.ap(
    modal.body,
    ws.dom.cr('span', '', 'License info goes here')
  );

  ws.licenseInfo = {
    /** Show license information modal
     *  @namespace ws.licenseInfo
     *  @type function
     */
    show: modal.show
  };
})();
