

// @format

(function() {
  var container = ws.dom.cr('div', 'ws-snackbar no-print'),
    title = ws.dom.cr('span', 'snackbar-title', ''),
    action = ws.dom.cr('span', 'snackbar-action', ''),
    closeNode = ws.dom.cr(
      'span',
      'ws-snackbar-close fa fa-times-circle',
      ''
    ),
    timeout = false,
    callback = false;

  ws.ready(function() {
    ws.dom.ap(
      document.body,
      ws.dom.ap(container, title, action, closeNode)
    );
  });

  ws.dom.on(container, 'mouseover', function() {
    window.clearTimeout(timeout);
  });

  ws.dom.on(container, 'mouseout', function() {
    hide();
  });

  ws.dom.on(closeNode, 'click', function() {
    ws.dom.style(container, {
      bottom: '-68px'
    });
  });

  ///////////////////////////////////////////////////////////////////////////

  function hide() {
    timeout = window.setTimeout(function() {
      ws.dom.style(container, {
        bottom: '-68px'
      });
    }, 5000);
  }

  ///////////////////////////////////////////////////////////////////////////

  /**  Show a snackbar
     *   A snack bar is those info rectangles showing up on the bottom left.
     *
     *   @example
     *   ws.snackBar('Hello world!');
     *
     *   @param stitle {string} (optional) - the snackbar title
     *   @param saction {string} (optional) - the snackbar action text
     *   @param fn {function} (optional) - the function to call when clicking the action
     */
  ws.snackBar = function(stitle, saction, fn) {
    title.innerHTML = stitle; // .toUpperCase();

    window.clearTimeout(timeout);

    if (saction) {
      action.innerHTML = saction.toUpperCase();
    }

    if (callback) {
      callback();
    }

    ws.dom.style(container, {
      bottom: '10px'
    });

    ws.dom.style(action, {
      display: saction ? '' : 'none'
    });

    callback = ws.dom.on(action, 'click', fn);

    hide();
  };
})();
