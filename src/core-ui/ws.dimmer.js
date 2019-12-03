

// @format

(function() {
  /** Show a dimmer backdrop
     *
     *  Used to catch input when showing modals, context menus etc.
     *
     *  @example
     *  ws.showDimmer(function () {
     *       alert('You clicked the dimmer!');
     *  });
     *
     *  @param {function} fn - the function to call when the dimmer is clicked
     *  @param {bool} autohide - set to true to hide the dimmer when it's clicked
     *  @param {bool} transparent - set to true for the dimmer to be transparent
     *  @param {number} zIndex - the z index *offset*
     *  @return {function} - A function that can be called to hide the dimmer
     */
  ws.showDimmer = function(fn, autohide, transparent, zIndex) {
    var dimmer = ws.dom.cr('div', 'ws-dimmer'),
      unbinder = false;

    ws.dom.ap(document.body, dimmer);

    ws.dom.style(dimmer, {
      opacity: 0.4,
      'pointer-events': 'auto',
      'z-index': 9999 + (zIndex || 0)
    });

    if (transparent) {
      ws.dom.style(dimmer, {
        opacity: 0
      });
    }

    function hide() {
      ws.dom.style(dimmer, {
        opacity: 0,
        'pointer-events': 'none'
      });

      if (ws.isFn(unbinder)) {
        unbinder();
        unbinder = false;
      }

      window.setTimeout(function() {
        if (dimmer.parentNode) {
          dimmer.parentNode.removeChild(dimmer);
        }
      }, 300);
    }

    unbinder = ws.dom.on(dimmer, 'click', function(e) {
      if (ws.isFn(fn)) {
        fn();
      }

      if (autohide) {
        hide();
      }
    });

    return hide;
  };
})();
