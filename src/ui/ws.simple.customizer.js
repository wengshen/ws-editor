

// @format

(function() {
  var flatOptions = {};

  function dive(tree) {
    if (tree) {
      if (ws.isArr(tree)) {
        tree.forEach(dive);
      } else if (tree.options) {
        if (ws.isArr(tree.options)) {
          tree.options.forEach(dive);
        } else {
          Object.keys(tree.options).forEach(function(key) {
            dive(tree.options[key]);
          });
        }
      } else if (tree.id) {
        flatOptions[tree.id] = tree;
      }
    }
  }

  dive(ws.meta.optionsExtended);

  /** Simple version of the customizer. Whitelisted options
   *  @constructor
   *  @emits PropertyChange - when a property is modified
   *  @param parent {domnode} - the node to append to
   *  @param attributes {object} - settings
   *    > availableSettings {array} - whitelist of options to include
   */
  ws.SimpleCustomizer = function(parent, attributes) {
    var events = ws.events(),
      container = ws.dom.cr('div', 'ws-simple-customizer'),
      table = ws.dom.cr('table', 'ws-customizer-table'),
      properties = ws.merge(
        {
          availableSettings: [
            'title--text',
            'subtitle--text',
            'colors',
            'chart--backgroundColor',
            'yAxis-title--style',
            'yAxis--type',
            'yAxis--opposite',
            'yAxis--reversed',
            'yAxis-labels--format'
          ]
        },
        attributes
      );

    ////////////////////////////////////////////////////////////////////////

    /** Build the property setter
     *  @memberof ws.SimpleCustomizer
     *  @param options {object} - the current chart options
     */
    function build(options) {
      table.innerHTML = '';

      properties.availableSettings.forEach(function(name) {
        var group = ws.merge(
          {
            text: name.replace(/\-/g, ' '),
            id: name,
            tooltipText: false,
            dataType: 'string',
            defaults: false,
            custom: {},
            values: false
          },
          flatOptions[name]
        );

        ws.dom.ap(
          table,
          ws.InspectorField(
            group.values ? 'options' : group.dataType,
            ws.getAttr(options, group.id, 0) || group.defaults,
            {
              title: group.text,
              tooltip: group.tooltipText,
              values: group.values,
              custom: group.custom,
              defaults: group.defaults,
              attributes: group.attributes || []
            },
            function(newValue) {
              events.emit('PropertyChange', group.id, newValue, 0);
            },
            false,
            group.id
          )
        );
      });
    }

    function highlightNode(n) {
      if (!n) return;

      ws.dom.style(n, {
        border: '2px solid #33aa33'
      });

      n.focus();
      n.scrollIntoView(true);

      window.setTimeout(function() {
        ws.dom.style(n, {
          border: ''
        });
      }, 2000);
    }

    /** Focus a field in the inspector
     *  @memberof ws.SimpleCustomizer
     *  @param thing {object} - the thing to focus
     *    > id {anything} - the id of the field
     *  @param x {number} - the x position the request came from
     *  @param y {number} - the y position the request came from
     */
    function focus(thing, x, y) {
      var id = thing.id;
      if (id.indexOf('-') >= 0) {
        highlightNode(table.querySelector('#' + id));
      }
    }

    ////////////////////////////////////////////////////////////////////////

    ws.ready(function() {
      ws.dom.ap(
        parent,
        ws.dom.ap(
          container,
          ws.dom.cr('div', 'ws-customizer-table-heading', 'Edit Chart'),
          table
        )
      );
    });

    return {
      focus: focus,
      on: events.on,
      build: build
    };
  };
})();
