

// @format

(function() {
  var container = ws.dom.cr(
    'div',
    'ws-scrollbar ws-tooltip ws-tooltip-fixed'
  );

  ws.ready(function() {
    ws.dom.ap(document.body, container);
  });

  function hide() {
    ws.dom.style(container, {
      opacity: 0,
      'pointer-events': 'none'
    });
  }

  ws.dom.on(container, 'mouseout', hide);
  ws.dom.on(container, 'click', hide);

  /** Show a tooltip
     *  @param x {number} - the x position of the tooltip
     *  @param y {number} - the y position of the tooltip
     *  @param tip {string} - the title
     *  @param blowup {boolean}  - blow the tooltip up
     */
  ws.Tooltip = function(x, y, tip, blowup) {
    var ds = ws.dom.size(document.body);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x > ds.w - 200) x = ds.w - 200;

    ws.dom.style(container, {
      opacity: 1,
      'pointer-events': 'auto',
      left: x + 'px',
      top: y + 'px',
      'max-width': '300px'
    });

    if (blowup) {
      ws.dom.style(container, {
        opacity: 1,
        'pointer-events': 'auto',
        width: '90%',
        height: '90%',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      });
    }

    container.innerHTML = tip;

    return hide;
  };

  ws.hideAllTooltips = hide;
})();
