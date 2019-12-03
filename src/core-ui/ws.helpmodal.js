

// @format

ws.HelpModal = function(items) {
  var active = false,
    nav = ws.dom.cr('div', 'ws-help-nav'),
    body = ws.dom.cr('div'),
    counter = ws.dom.cr('div', 'ws-help-counter'),
    modal = ws.OverlayModal(false, {
      width: 600,
      height: 600
    });

  items.forEach(function(item, i) {
    var container = ws.dom.cr('div'),
      heading = ws.dom.cr('div', 'ws-modal-title ws-help-toolbar', item.title),
      gif = ws.dom.cr('div', 'ws-help-gif'),
      desc = ws.dom.cr('div', 'ws-scrollbar ws-help-desc'),
      activate = ws.dom.cr('span', 'ws-icon fa fa-circle-o');

    if (ws.isArr(item.description)) {
      item.description = item.description.join(' ');
    }

    desc.innerHTML = item.description;
    if (item.gif) {
      item.gif = ws.option('helpImgPath') + item.gif;

      ws.dom.style(gif, {
        'background-image': 'url("' + item.gif + '")'
      });
    } else {
      ws.dom.style(gif, { display: 'none' });
    }

    function makeActive() {
      if (active) {
        active.className = 'ws-icon fa fa-circle-o';
      }

      body.innerHTML = '';
      activate.className = 'ws-icon fa fa-circle';
      ws.dom.ap(body, container);
      active = activate;

      counter.innerHTML = i + 1 + '/' + items.length;
    }

    ws.dom.on(activate, 'click', makeActive);

    ws.dom.ap(container, heading, gif, desc);

    ws.dom.ap(nav, activate);

    if (i === 0) {
      makeActive();
    }
  });

  if (items.length < 2) {
    ws.dom.style([nav, counter], {
      display: 'none'
    });
  }

  ws.dom.ap(modal.body, body, nav, counter);

  return {
    show: modal.show
  };
};
