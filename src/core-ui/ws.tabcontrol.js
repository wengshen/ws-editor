

// @format

/** Standard tabcontrol component
 *  @example
 *  var tabs = ws.TabControl(document.body),
 *      tab1 = tabs.createTab({title: 'Tab 1'}),
 *      tab2 = tabs.createTab({title: 'Tab 2'})
 *  ;
 *  //Append things to tab1|tab2.body
 *
 *  @constructor
 *
 *  @emits Focus {object} - when a new tab gets focus.
 *
 *  @param parent {domnode} - the node to attach to
 *  @param noOverflow {boolean} - set to true to disable scrollbars
 *  @param extraPadding {boolean} - set to true to have extra padding in bodies
 */
ws.TabControl = function(parent, noOverflow, extraPadding, skipTabs) {
  var container = ws.dom.cr('div', 'ws-tab-control'),
    paneBar = ws.dom.cr('div', (!skipTabs ? 'tabs' : '')), //Quck fix for now, will change once design finalised.
    body = ws.dom.cr('div', 'body'),
    indicator = ws.dom.cr('div', 'indicator'),
    more = ws.dom.cr('div', (!skipTabs ? 'ws-tab-control-more fa fa-chevron-right' : '')),
    events = ws.events(),
    selectedTab = false,
    tabs = [],
    ctx = ws.ContextMenu();

  ///////////////////////////////////////////////////////////////////////////

  //Build ctx menu
  function buildCTX() {
    ctx.build(
      tabs.map(function(tab) {
        return {
          title: tab.title,
          click: tab.focus,
          selected: tab.selected
        };
      })
    );
  }

  ws.dom.on(more, 'click', function(e) {
    buildCTX();
    ctx.show(e.clientX, e.clientY);
  });

  /** Force a resize of the tab control
   *  @memberof ws.TabControl
   *  @param w {number} - the width, uses parent width if null
   *  @param h {number} - the height, uses parent width if null
   */
  function resize(w, h) {
    var cs = ws.dom.size(parent),
    width = 0;

    if (!skipTabs) var ps = ws.dom.size(paneBar);

    ws.dom.style(container, {
      height: (h || cs.h) + 'px'
    });

    ws.dom.style(body, {
      height: (h || cs.h) /*- ps.h*/ + 'px'
    });

    //Also re-focus the active tab
    if (selectedTab) {
      selectedTab.focus();
    }

    //clientWidth/scrollWidth doesn't produce what we need,
    //so let's check the accumulated width of the tabs.

    tabs.forEach(function(tab) {
      width += ws.dom.size(tab.node).w || 0;
    });
    
    if (!skipTabs) {
      if (width > paneBar.scrollWidth) {
        ws.dom.style(more, {
          display: 'block'
        });
      } else {
        ws.dom.style(more, {
          display: 'none'
        });
      }
    }

    
  }

  /** Select the first tab
   *  @memberof ws.TabControl
   */
  function selectFirst() {
    tabs.some(function(tab) {
      if (tab.visible()) {
        tab.focus();
        return true;
      }
    });
  }

  function select(index) {
    if (tabs[index] && tabs[index].visible()) {
      tabs[index].focus();
    }
  }

  /** Hide the tab control
   *  @memberof ws.TabControl
   */
  function hide() {
    ws.dom.style(container, {
      display: 'none'
    });
  }

  /** Show the tab control
   *  @memberof ws.TabControl
   */
  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
  }

  function updateVisibility() {
    var c = tabs.filter(function(a) {
      return a.visible();
    }).length;

    if (!skipTabs){
      if (c < 2) {
        ws.dom.style(paneBar, {
          display: 'none'
        });
      } else {
        ws.dom.style(paneBar, {
          display: ''
        });
      }
    }
  }

  /* Create and return a new tab
     * @memberof ws.TabControl
     * @name createTab
     * @properties - the properties for the tab:
     *   > title {string} - the title of the tab
     * @returns {object} - an interface to the tab
     *    > hide {function} - hide the tab
     *    > show {function} - show the tab
     *    > focus {function} - make the tab active
     *    > visible {function} - returns true if the tab is visible
     *    > body {domnode} - the tab body
     */
  function Tab(properties) {
    var tevents = ws.events(),
      tab = ws.dom.cr('div', 'tab', properties.title),
      tbody = ws.dom.cr('div', 'tab-body'),
      visible = true,
      texports = {
        selected: false
      };

    if (extraPadding) {
      tbody.className += ' tab-body-padded';
    }
    if (!skipTabs) {
      ws.dom.ap(paneBar, tab);
    }

    ws.dom.ap(body, tbody);

    function hide() {
      visible = false;
      ws.dom.style(tab, { display: 'none' });
      updateVisibility();
    }

    function show() {
      visible = true;
      ws.dom.style(tab, { display: '' });
      updateVisibility();
    }

    function resize(w, h) {
      ws.dom.style(container, { width: w + 'px', height: h + 'px' });
    }

    function focus() {
      var tsize = ws.dom.size(tab),
        tpos = ws.dom.pos(tab);
      if (!visible) {
        return;
      }

      if (selectedTab) {
        selectedTab.node.className = 'tab';
        selectedTab.selected = false;

        ws.dom.style(selectedTab.body, {
          opacity: 0,
          //                  'pointer-events': 'none',
          display: 'none'
        });
      }

      if (!tsize || !tpos || !tsize.w) {
        //We're not ready yet..
      }

      ws.dom.style(indicator, {
        width: tsize.w + 'px',
        left: tpos.x + 'px'
      });

      tab.className = 'tab tab-selected';

      ws.dom.style(tbody, {
        opacity: 1,
        //                'pointer-events': 'auto',
        display: 'block'
      });

      selectedTab = texports;
      selectedTab.selected = true;
      tevents.emit('Focus');

      events.emit('Focus', texports);
    }

    ws.dom.on(tab, 'click', function() {
      focus();
      ws.emit('UIAction', 'TabControlNavigation', properties.title);
    });

    texports = {
      on: tevents.on,
      focus: focus,
      node: tab,
      body: tbody,
      hide: hide,
      show: show,
      resize: resize,
      title: properties.title,
      visible: function() {
        return visible;
      }
    };

    if (!selectedTab) {
      focus();
    }

    if (noOverflow) {
      ws.dom.style(tbody, {
        overflow: 'hidden'
      });
    }

    tabs.push(texports);

    resize();
    updateVisibility();

    return texports;
  }

  ///////////////////////////////////////////////////////////////////////////

  if (!ws.isNull(parent)) {
    ws.ready(function() {
      ws.dom.ap(
        parent,
        ws.dom.ap(container, ws.dom.ap(paneBar, more, indicator), body)
      );

      resize();
      updateVisibility();
    });
  }

  ///////////////////////////////////////////////////////////////////////////

  return {
    container: container,
    on: events.on,
    createTab: Tab,
    resize: resize,
    select: select,
    selectFirst: selectFirst,
    show: show,
    hide: hide,
    /** Get the size of the title bar
     *  @memberof ws.TabControl
     *  @returns {object}
     *    > w {number} - the width of the control
     *    > h {number} - the height of the control
     */
    barSize: function() {
      return ws.dom.size(paneBar);
    }
  };
};
