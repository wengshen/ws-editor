

// @format

/** Namespace for DOM helper functions
 * @ignore
 */
ws.dom = {
  /** Check if a node is visible
     *  @namespace ws.dom
     *  @param node {domnode} - the node to check
     */
  isVisible: function(node) {
    var style = window.getComputedStyle(node);
    return style.display !== 'none';
  },

  /** Append a set of nodes to another node.
     * Arguments supplied after the @param {} target represents the children to append.
     * @namespace ws.dom
     * @param target {object} - the node to append to
     * @return {domnode} - the target
     */
  ap: function(target) {
    var children = Array.prototype.slice.call(arguments);
    children.splice(0, 1);

    target = ws.dom.get(target);

    if (!ws.isNull(target) && typeof target.appendChild !== 'undefined') {
      children.forEach(function(child) {
        if (ws.isArr(child)) {
          child.forEach(function(sc) {
            ws.dom.ap(target, sc);
          });
        } else if (
          typeof child !== 'undefined' &&
          typeof child.appendChild !== 'undefined'
        ) {
          target.appendChild(child);
        } else if (child !== false) {
          ws.log(1, 'child is not valid (ws.dom.ap)');
        }
      });
    } else {
      ws.log(1, 'target is not a valid DOM node (ws.dom.ap)');
    }

    return target;
  },

  /** Create a set of options for a select
     * @namespace ws.dom
     * @param select {HTMLSelect} - the dropdown to add options to
     * @param options {(array|object)} - the options as an array or as an object keyed on ID
     * @param selected {number} - the index of the selected option
     */
  options: function(select, options, selected) {
    if (ws.isNull(options)) {
    } else if (ws.isArr(options)) {
      options.forEach(function(option) {
        ws.dom.ap(select, ws.dom.cr('option', '', option, option));
      });

      if (selected) {
        select.selectedIndex = selected;
      }
    } else if (ws.isStr(options)) {
      try {
        ws.dom.options(select, JSON.parse(options));
      } catch (e) {
        ws.log(e + ' in ws.options (json parser)');
      }
    } else {
      Object.keys(options).forEach(function(key) {
        ws.dom.ap(select, ws.dom.cr('option', '', options[key], key));
      });
    }
  },

  /** Show a node when another is hovered
     * @namespace ws.dom
     * @param parent {object} - the node to listen for the hover on
     * @param child {object} - the node to show when the parent is hovered
     */
  showOnHover: function(parent, child) {
    if (ws.isArr(child)) {
      child.forEach(function(c) {
        ws.dom.showOnHover(parent, c);
      });
      return;
    }

    ws.dom.on(parent, 'mouseover', function() {
      ws.dom.style(child, {
        //display: 'block',
        opacity: 1,
        //  background: 'rgba(46, 46, 46, 0.85)',
        'pointer-events': 'auto'
      });
    });

    ws.dom.on(parent, 'mouseout', function() {
      ws.dom.style(child, {
        //display: 'none',
        opacity: 0,
        //background: 'rgba(0, 0, 0, 0)',
        'pointer-events': 'none'
      });
    });
  },

  /** Create a new HTML node
     * @namespace ws.dom
     * @param type {string} - the type of node to create
     * @param cssClass {string} (optional) - the css class to use for the node
     * @param innerHTML {string} (optional) - the inner html of the new node
     * @param id {string} (optional) - the id of the new node
     *
     * @return {domnode} - the new dom node
     */
  cr: function(type, cssClass, innerHTML, id) {
    var res = false;

    if (typeof type !== 'undefined') {
      res = document.createElement(type);

      if (typeof cssClass !== 'undefined') {
        res.className = cssClass;
      }
      if (typeof innerHTML !== 'undefined' && typeof innerHTML !== 'object') {
        res.innerHTML = innerHTML;
      }

      if (typeof id !== 'undefined') {
        res.id = id;
      }
    } else {
      ws.log(1, 'no node type supplied (ws.dom.cr');
    }

    return res;
  },

  /** Style a node
     * @namespace ws.dom
     * @param nodes {(object|array)}  - the node to style. Can also be an array
     * @param style {object} - object containing style properties
     *
     * @return {anything} - whatever was supplied to @param {} nodes
     */
  style: function(nodes, style) {
    if (ws.isArr(nodes)) {
      nodes.forEach(function(node) {
        ws.dom.style(node, style);
      });
      return nodes;
    }

    if (nodes && nodes.style) {
      Object.keys(style).forEach(function(p) {
        nodes.style[p] = style[p];
      });
      return nodes;
    }
    return false;
  },

  /** Attach an event listener to a dom node
     * @namespace ws.dom
     * @param target {object} - the dom node to attach to
     * @param event {string} - the event to listen for
     * @param callback {function} - the function to call when the event is emitted
     * @param context {object} (optional) - the context of the callback function
     *
     * @return {function} - a function that can be called to unbind the handler
     */
  on: function(target, event, callback, context) {
    var s = [];

    if (!target) {
      return function() {};
    }

    if (ws.isArr(event)) {
      event.forEach(function(event) {
        s.push(ws.dom.on(target, event, callback, context));
      });

      return function() {
        s.forEach(function(f) {
          f();
        });
      };
    }

    if (target === document.body && event === 'resize') {
      //Need some special magic here eventually.
    }

    if (target && target.forEach) {
      target.forEach(function(t) {
        s.push(ws.dom.on(t, event, callback));
      });
    }

    if (s.length > 0) {
      return function() {
        s.forEach(function(f) {
          f();
        });
      };
    }

    function actualCallback() {
      if (ws.isFn(callback)) {
        return callback.apply(context, arguments);
      }
      return;
    }

    if (target.addEventListener) {
      target.addEventListener(event, actualCallback, false);
    } else {
      target.attachEvent('on' + event, actualCallback, false);
    }

    return function() {
      if (window.removeEventListener) {
        target.removeEventListener(event, actualCallback, false);
      } else {
        target.detachEvent('on' + event, actualCallback);
      }
    };
  },

  nodefault: function(e) {
    e.cancelBubble = true;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  },

  /** Get or set the value of a node
     * @namespace ws.dom
     * @param node {object} - the node to get the value of
     * @param value {(string|bool|number)} (optional) - the value to set
     * @return {anything} - the value
     */
  val: function(node, value) {
    if (node.tagName === 'SELECT') {
      if (node.selectedIndex >= 0) {
        if (!ws.isNull(value)) {
          for (var i = 0; i < node.options.length; i++) {
            if (node.options[i].id === value) {
              node.selectedIndex = i;
              break;
            }
          }
        }
        return node.options[node.selectedIndex].id;
      }
    } else if (node.tagName === 'INPUT') {
      if (node.type === 'checkbox') {
        if (!ws.isNull(value)) {
          node.checked = ws.toBool(value);
        }
        return node.checked;
      }
      if (!ws.isNull(value)) {
        node.value = value;
      }
      return node.value;
    } else {
      if (!ws.isNull(value)) {
        node.innerHTML = value;
      }
      return node.innerText;
    }

    return false;
  },

  /** Get the size of a node
     * @namespace ws.dom
     * @param node {object} - the node to get the size of
     * @return {object} - the size as an object `{w, h}`
     */
  size: function(node) {
    return {
      w: node.clientWidth,
      h: node.clientHeight
    };
  },

  /** Get the position of a node
     * @namespace ws.dom
     * @param node {object} - the node to get the position of
     * @param abs {boolean} - absolute calculation rather than parent relative
     * @return {object} - the position as an object `{x, y}`
     */
  pos: function(node, abs) {
    var x = 0,
      y = 0;

    if (abs) {
      var b = node.getBoundingClientRect();
      
      return {
        x: b.left + (window.scrollX || 0),
        y: b.top + (window.scrollY || 0)
      };
    }

    return {
      x: node.offsetLeft,
      y: node.offsetTop
    };
  },

  /** Find a node
     * @namespace ws.dom
     * @param node {object} - the node to find. Either a string or an actual node instance
     * @return {object} - the node or false if the node was not found
     */
  get: function(node) {
    if (node && node.appendChild) {
      return node;
    }
    return document.getElementById(node) || false;
  }
};
