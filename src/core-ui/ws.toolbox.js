

// @format

ws.Toolbox = function(parent, attr) {
  var events = ws.events(),
    container = ws.dom.cr(
      'div',
      'ws-transition ws-toolbox ws-wizard ws-box-size'
    ),
    bar = ws.dom.cr('div', 'ws-toolbox-bar ws-box-size ws-wizard-title-container'),
    body = ws.dom.cr(
      'div',
      'ws-toolbox-body ws-toolbox-body-no-border ws-box-size ws-transition ws-wizard-body'
    ),
    activeTimeout,
    expanded = false,
    activeItem = false,
    properties = ws.merge(
      {
        animate: true
      },
      attr
    );

  function addEntry(def) {
    var props = ws.merge(
        {
          number: 0,
          title: 'Title Missing'
        },
        def
      ),
      entryEvents = ws.events(),
      title = ws.dom.cr('div', 'ws-toolbox-body-title wizard', props.hideTitle ? '' : props.title),
      contents = ws.dom.cr(
        'div',
        'ws-box-size ws-toolbox-inner-body'
      ),
      userContents = ws.dom.cr(
        'div',
        'ws-box-size ws-toolbox-user-contents ws-createchart-body-container'
      ),
      iconClass = 'ws-toolbox-list-item-container',
      icon = ws.dom.cr('div', iconClass),
      resizeTimeout,
      exports = {},
      circle = ws.dom.cr('div', 'ws-toolbox-list-circle', props.number);

    ws.dom.on(circle, 'click', function() {
      props.onClick(props.number);
      expand();

    });

    ws.dom.ap(icon, circle, ws.dom.cr('div', 'ws-toolbox-list-title', props.title));
    ws.dom.on(icon, 'click', function() {
      entryEvents.emit('Click');
    });

    function resizeBody() {
      var bsize = ws.dom.size(body),
        tsize = ws.dom.size(title),
        size = {
          w: bsize.w,
          h: bsize.h - tsize.h - 55
        };
/*
      ws.dom.style(contents, {
        width: size.w + 'px',
        height: size.h + 'px'
      });
*/
      return size;
    }

    function expand() {
      var bsize = ws.dom.size(bar);
      
      var newWidth = props.width;

      if (expanded && activeItem === exports) {
        return;
      }

      if (props.iconOnly) {
        return;
      }

      if (activeItem) {
        activeItem.disselect();
      }

      entryEvents.emit('BeforeExpand');

      body.innerHTML = '';
      ws.dom.ap(body, contents);
      
      ws.dom.style(body, {
        height: (bsize.h - 55) + 'px',
        opacity: 1
      });

      ws.dom.style(container, {
        width: newWidth + '%'
      });

      events.emit('BeforeResize', newWidth);

      expanded = true;

      setTimeout(function() {
        var height = resizeBody().h;

        events.emit('Expanded', exports, newWidth);
        entryEvents.emit('Expanded', newWidth, height - 20);
      }, 300);

      if (props.iconOnly) {
        activeItem = false;
      } else {
        icon.className = iconClass + ' active';
        activeItem = exports;
      }

      ws.emit('UIAction', 'ToolboxNavigation', props.title);
    }

    function collapse() {
      var newWidth = ws.dom.size(bar).w;

      if (expanded) {
        ws.dom.style(body, {
          width: '0px',
          opacity: 0.1
        });

        ws.dom.style(container, {
          width: newWidth + '%'
        });

        events.emit('BeforeResize', newWidth);

        disselect();
        expanded = false;
        activeItem = false;

      }
    }

    function toggle() {
        expand();
    }

    function disselect() {
      icon.className = iconClass + ' completed';
    }

    function removeCompleted() {
      setTimeout(function() {
        icon.classList.remove('completed');
      }, 50);
    }

    //ws.dom.on(icon, 'click', toggle);
    ws.dom.ap(bar, icon);
    ws.dom.ap(contents, title, userContents);

    function reflowEverything() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        ws.dom.style(body, { height: '' });
        if (expanded) {
          var height = resizeBody().h;
          entryEvents.emit('Expanded', ws.dom.size(bar), height - 20);
        }
      }, 100);
    }

    ws.dom.on(window, 'resize', reflowEverything);

    exports = {
      on: entryEvents.on,
      expand: expand,
      collapse: collapse,
      body: userContents,
      removeCompleted: removeCompleted,
      disselect: disselect
    };
    return exports;
  }

  function width() {
    var bodySize = ws.dom.size(body),
      barSize = ws.dom.size(bar);

    return bodySize.w + barSize.w;
  }

  function clear() {
    bar.innerHTML = '';
    body.innerHTML = '';
  }

  ws.dom.ap(parent, ws.dom.ap(container,bar,body));

  return {
    clear: clear,
    on: events.on,
    addEntry: addEntry,
    width: width
  };
};
