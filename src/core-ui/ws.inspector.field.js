

// @format

/** An editable field
 *
 *  Creates a table row with three columns:
 *    - label
 *    - widget
 *    - help icon
 *  @todo This needs a proper cleaning now that the requirements are set.
 *  @example
 *  //Create a table, append to body, add a color picker to it.
 *  ws.dom.ap(document.body,
 *      ws.dom.ap(ws.dom.cr('table'),
 *          ws.InspectorField('color', '#FFF', {
 *              title: 'Set the color!'
 *          }, function (newValue) {
 *              ws.dom.style(document.body, {
 *                  backgroundColor: newValue
 *              });
 *          })
 *      )
 *  );
 *
 *  @param type {enum} - the type of widget to use
 *    > string
 *    > number
 *    > range
 *    > boolean
 *    > color
 *    > font
 *    > options
 *    > object
 *  @param value {anything} - the current value of the field
 *  @param properties {object} - the properties for the widget
 *  @param fn {function} - the function to call when the field is changed
 *     > {anything} - the changed value
 *  @param nohint {boolean} - if true, the help icon will be skipped
 *  @param fieldID {anything} - the id of the field
 *  @returns {domnode} - a DOM node containing the field + label wrapped in a tr
 */
ws.InspectorField = function(type, value, properties, fn, nohint, fieldID, planCode) {
  
  var createReset = function(resetTo, callback) {
      var node = ws.dom.cr('div', 'ws-field-reset fa fa-undo');

      if (resetTo === 'null') {
        resetTo = null;
      }

      ws.dom.on(node, 'click', function() {
        if (ws.isFn(callback)) {
          callback(properties.defaults || resetTo);
        }
      });

      return node;
    },
    fields = {
      string: function(val, callback) {
        var input = ws.dom.cr('input', 'ws-field-input', '', fieldID),
          reset = createReset(properties.defaults || val || value, function(v) {
            input.value = val = v;
            tryCallback(callback, v);
          });

        ws.dom.on(input, 'change', function(e) {
          tryCallback(callback, input.value);
          e.cancelBubble = true;
        });

        if (typeof (val || value || '') === 'string' && 
            (val || value || '').indexOf('\\u') > -1) input.value = decodeURIComponent(JSON.parse('"' + (val || value).replace(/\"/g, '\\"') + '"')); 
        else input.value = (val || value);

  
        if (properties.warning && properties.warning.length > 0 && planCode && properties.warning.indexOf(planCode) > -1) {
          input.disabled = true;
        }
      
        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),/*
          reset,*/
          input
        );
      },
      header: function(val, callback) {
        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),/*
          reset,*/
          ws.dom.cr('div', 'ws-field-header', properties.header)
        );
      },
      number: function(val, callback) {
        var input = ws.dom.cr('input', 'ws-field-input', '', fieldID),
          reset = createReset(properties.defaults || val || value, function(v) {
            input.value = val = v;
            tryCallback(callback, parseFloat(v));
          });

        input.type = 'number';

        if (!ws.isNull(properties.custom)) {
          input.step = properties.custom.step;
          input.min = properties.custom.minValue;
          input.max = properties.custom.maxValue;
        }

        ws.dom.on(input, 'change', function() {
          tryCallback(callback, parseFloat(input.value));
        });

        input.value = val || value;

        if (properties.warning && properties.warning.length > 0 && planCode && properties.warning.indexOf(planCode) > -1) {
          input.disabled = true;
        }

        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),/*
          reset,*/
          input
        );
      },
      range: function(val, callback) {
        var slider = ws.Slider(false, {
          min: properties.custom.minValue,
          max: properties.custom.maxValue,
          step: properties.custom.step,
          value: val || value,
          resetTo: properties.defaults
        });

        slider.on('Change', function(v) {
          tryCallback(callback, v);
        });

        return slider.container;
      },
      boolean: function(val, callback) {
        var input = ws.dom.cr('input', '', '', fieldID),
          reset = createReset(properties.defaults || val || value, function(v) {
            input.checked = val = ws.toBool(v);
            tryCallback(callback, val);
          });

        input.type = 'checkbox';

        input.checked = ws.toBool(val || value);

        ws.dom.on(input, 'change', function() {
          tryCallback(callback, input.checked);
        });
        
        if (properties.warning && properties.warning.length > 0 && planCode && properties.warning.indexOf(planCode) > -1) {
          input.disabled = true;
        }

        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),/*
          reset,*/
          input
        );
      },
      color: function(val, callback) {
        var box = ws.dom.cr('div', 'ws-field-colorpicker', '', fieldID),
          reset = ws.dom.cr('div', 'ws-field-reset fa fa-undo'),
          resetTo = val || value || properties.defaults;

        
        if (resetTo === 'null') {
          resetTo = null;
        }

        function update(col, callback) {
          if (
            col &&
            col !== 'null' &&
            col !== 'undefined' &&
            typeof col !== 'undefined'
          ) {
            box.innerHTML = "";
            //box.innerHTML = col;
          } else {
            box.innerHTML = 'auto';
            col = '#FFFFFF';
          }

          ws.dom.style(box, {
            background: col,
            color: ws.getContrastedColor(col)
          });
        }

        function fixVal() {
          //This is very ugly
          try {
            val = JSON.parse(val);
          } catch (e) {}

          if (ws.isArr(val)) {
            val = '#FFF';
          }
        }

        fixVal();

        ws.dom.on(box, 'click', function(e) {
          ws.pickColor(e.clientX, e.clientY, val || value, function(col) {
            if (ws.isArr(val)) {
              val = '#FFFFFF';
            }

            val = col;
            update(col);
            tryCallback(callback, col);
          });
        });

        ws.dom.on(reset, 'click', function() {
          val = resetTo;
          fixVal();
          update(val);
          tryCallback(callback, val);
        });

        update(val || value);

        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),
          box/*,
          reset*/
        );
      },
      font: function(val, callback) {
        return fields.cssobject(val, callback);
      },
      configset: function(val, callback) {
        return fields.string(val, callback);
      },
      json: function(val, callback) {
        var textArea = ws.dom.cr(
            'textarea',
            'ws-field-input',
            '',
            fieldID
          ),
          errorBar = ws.dom.cr('div', 'ws-field-error'),
          editor = false,
          updateIt = function(v) {
            if (editor) {
              editor.setValue(JSON.stringify(v, undefined, '\t'));
            } else {
              textArea.value = JSON.stringify(v, undefined, '\t');
            }
          },
          reset = createReset(properties.defaults || val || value, function(v) {
            val = v;
            updateIt(v);
            tryCallback(callback, v);
          }),
          parent = ws.dom.ap(
            ws.dom.cr('div', 'ws-field-container', '', fieldID + '_container'),
            textArea,
            /*
            reset,*/
            errorBar
          );

        function resizePoll() {
          if (document.body && editor) {
            if (document.getElementById(fieldID)) {
              editor.refresh();
            } else {
              setTimeout(resizePoll, 10);
            }
          }
        }

        function callHome(v) {

          try {
            v = JSON.parse(v);
            tryCallback(callback, v);
            errorBar.innerHTML = '';
            ws.dom.style(errorBar, { display: 'none', opacity: 0 });
          } catch (e) {
            //ws.snackBar('There\'s an error in your JSON: ' + e);
            errorBar.innerHTML = 'Syntax error: ' + e;
            ws.dom.style(errorBar, { display: 'block', opacity: 1 });
          }
        }

        if (typeof window['CodeMirror'] !== 'undefined') {
          editor = CodeMirror.fromTextArea(textArea, {
            lineNumbers: true,
            mode: 'application/json',
            theme: ws.option('codeMirrorTheme')
          });

          updateIt(val || value || properties.defaults);

          var timeout = null;
          editor.on('change', function() {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
              callHome(editor.getValue());
            }, 1000);
          });

          resizePoll();
        } else {
          updateIt(val || value || properties.defaults);

          ws.dom.on(textArea, 'change', function() {
            callHome(textArea.value);
          });
        }

        return parent;
      },
      cssobject: function(val, callback) {
        var picker = ws.FontPicker(callback || fn, val || value),
          reset = createReset(properties.defaults || val || value, function(v) {
            val = v;
            picker.set(val);
            
            tryCallback(callback, v);
          });

        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),
          /*reset,*/
          picker.container
        );
      },
      options: function(val, callback) {
        var ddown = ws.DropDown(),
          reset = createReset(properties.defaults, function(v) {
            val = v;
            ddown.selectById(val);
            tryCallback(callback, v);
          });

        if (ws.isStr(properties.values)) {
          try {
            properties.values = JSON.parse(properties.values);
          } catch (e) {
            properties.values = properties.values.split(' ');
          }
        }

        ddown.addItems(properties.values);
        ddown.addItem({ title: 'auto', id: properties.defaults });

        ddown.selectById(val || value || properties.defaults);

        ddown.on('Change', function(selected) {
          tryCallback(callback, selected.id());
        });

        return ws.dom.ap(
          ws.dom.cr('div', 'ws-field-container'),
          ddown.container/*,
          reset*/
        );
      },
      object: function(val, callback) {
        //Create a sub-table of options
        var stable = ws.dom.cr(
            'table',
            'ws-customizer-table',
            '',
            fieldID
          ),
          wasUndefined = ws.isNull(val || value);

        val = val || value || {};

        if (ws.isStr(val)) {
          try {
            val = JSON.parse(val);
          } catch (e) {}
        }

        if (properties && ws.isArr(properties.attributes)) {
          properties.attributes.forEach(function(attr) {
            val[attr.name || attr.id] =
              val[attr.name || attr.id] ||
              attr.defaults ||
              (attr.dataType.indexOf('object') >= 0 ? {} : '');

            attr.title = ws.uncamelize(attr.title);

            ws.dom.ap(
              stable,
              ws.InspectorField(
                attr.dataType,
                val[attr.name || attr.id] || attr.defaults,
                attr,
                function(nval) {
                  val[attr.name || attr.id] = nval;
                  tryCallback(callback, val);
                }
              )
            );
          });
        }

        if (wasUndefined) {
          // tryCallback(callback, val);
        }

        return stable;
      },

      function: function(val, callback) {
        var container = ws.dom.cr(
            'div',
            'ws-field-container ws-field-code-container'
          ),
          field = ws.dom.cr('textarea', 'ws-field-code', '', fieldID),
          editor = false,
          reset = createReset(properties.defaults || val || value, function(v) {
            val = v;
            updateIt(v);
            callHome(v);
          });

        function updateIt(v) {
          if (ws.isFn(v)) {
            v = v.toString();
          }

          if (editor) {
            editor.setValue(v);
            editor.refresh();
          } else {
            field.value = v;
          }
        }

        function callHome(v) {
          var args = [];
          var argStart = v.indexOf('(');
          var argEnd = v.substr(argStart + 1).indexOf(')');
          var body = '';
          var balance = 0;
          var parsing = false;

          try {
            args = v
              .substr(argStart + 1, argEnd - 1)
              .trim()
              .split(',');

            args = args.filter(function(b) {
              return b && b.length > 0 && b.indexOf('/*') === -1;
            });

            for (var i = 0; i < v.length; i++) {
              if (v[i] === '{') {
                balance++;
                parsing = true;
              } else if (v[i] === '}') {
                balance--;
                if (balance === 0) {
                  parsing = false;
                }
              } else if (parsing) {
                body += v[i];
              }
            }

            v = new Function(args, body);
          } catch (e) {
            console.log(e);
            return;
          }
          tryCallback(callback, v);
        }

        function resizePoll() {
          if (editor && document.body) {
            if (container.parentNode) {
              editor.refresh();
            } else {
              setTimeout(resizePoll, 50);
            }
          }
        }

        ws.dom.ap(container, field);

        if (typeof window['CodeMirror'] !== 'undefined') {
          editor = CodeMirror.fromTextArea(field, {
            lineNumbers: true,
            mode: 'javascript',
            theme: ws.option('codeMirrorTheme')
          });

          editor.on('change', function() {
            callHome(editor.getValue());
          });

          resizePoll();
        } else {
          ws.dom.on(field, 'change', function() {
            callHome(field.value);
          });
        }

        updateIt(val || value || properties.defaults || function() {});

        return container;
      },

      array: function() {
        var container = ws.dom.cr('div', '', '', fieldID),
          add = ws.dom.cr('span', 'ws-field-array-add fa fa-plus', ''),
          itemsNode = ws.dom.cr('div', 'ws-inline-blocks'),
          items = {},
          itemCounter = 0,
          itemTable = ws.dom.cr('table', 'ws-field-table');

        if (ws.isStr(value)) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            return container;
          }
        }

        if (value && !ws.isArr(value) && !ws.isBasic(value)) {
          // This is an object.
          value = Object.keys(value).map(function(e) {
            return value[e];
          });
        }

        function addCompositeItem(val, suppressCallback) {
          var item,
            rem = ws.dom.cr('span', 'ws-icon fa fa-trash ws-trash-button'),
            row = ws.dom.cr('div', 'color-row'), //tr
            id = ++itemCounter;

          function processChange(newVal) {
            if (newVal) {
              items[id].value = newVal;
              doEmitCallback();
            }
          }

          function doEmitCallback() {
            if (ws.isFn(fn)) {
              fn(
                Object.keys(items).map(function(key) {
                  return items[key].value;
                })
              );
            }
          }

          if (ws.isArr(val)) {
            val = val[id];
          }

          items[id] = {
            id: id,
            row: row,
            value: val
          };

          item = fields[properties.subType]
            ? fields[properties.subType](
                val || value[id] || properties.defaults,
                processChange
              )
            : fields.string(val, processChange);

          ws.dom.ap(
            itemTable,
            ws.dom.ap(
              row,
              ws.dom.ap(ws.dom.cr('div'), item), //td
              ws.dom.ap(ws.dom.cr('div'), rem) //td
            )
          );

          ws.dom.on(rem, 'click', function(e) {
            delete items[id];
            itemTable.removeChild(row);

            doEmitCallback();

            e.cancelBubble = true;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          });

          if (!suppressCallback) {
            processChange();
          }
        }

        ws.dom.ap(container, itemTable);

        ws.dom.on(add, 'click', function() {
          addCompositeItem();
        });

        if (ws.isArr(value)) {
          value.forEach(function(item) {
            addCompositeItem(item, true);
          });
        }

        ws.dom.ap(container, itemsNode, add);

        return container;
      }
    },
    help = ws.dom.cr(
      'span',
      'ws-icon ws-field-help fa fa-question-circle'
    ),
    helpTD = ws.dom.cr('div', 'ws-customizer-table-help'), //td
    widgetTD = ws.dom.cr('div', 'ws-field-table-widget-column'), //td
    titleCol = ws.dom.cr('div'), //td
    typeIndicator = ws.dom.cr('span', 'ws-customize-type');

  function tryCallback(cb, val) {
    cb = cb || fn;
    if (ws.isFn(cb)) {
      cb(val);
    }
  }

  function deduceObject() {
    if (
      (!properties.attributes || !properties.attributes.length) &&
      properties.defaults
    ) {
      properties.attributes = [];

      //There's no attributes but it's an object.
      //Check if there are default values we can use
      //to figure out the structure.
      if (properties.defaults) {
        try {
          properties.defaults = JSON.parse(properties.defaults);
          Object.keys(properties.defaults).forEach(function(k) {
            var tp = 'string',
              def = properties.defaults[k],
              up = k.toUpperCase(),
              vals;

            //This is hackish.
            if (ws.isNum(def)) {
              tp = 'number';
            }

            if (
              def.length &&
              def[0] === '#' &&
              (up.indexOf('BACKGROUND') >= 0 || up.indexOf('COLOR') >= 0)
            ) {
              tp = 'color';
            }

            properties.attributes.push({
              id: k,
              title: k,
              dataType: tp,
              defaults: properties.defaults[k],
              tooltip: '',
              values: vals
            });
          });
        } catch (e) {
          ws.log(
            3,
            'property',
            properties.id,
            'skipped, no way to deduce the object members'
          );
          return;
        }
      }
    } else {
      type = 'json';
      properties.defaults = properties.defaults || {};
    }
  }

  if (ws.isNull(value)) {
    value = '';
  }

  if (type === 'cssobject' || type === 'highcharts.cssobject') {
    //So there are more than one version of this thing - one of them
    //requires a font picker, the other is dynamic.
    //Figure out which one we're dealing with here.

    // properties = properties || {};
    // properties.attributes = [
    //     {name: 'x', title: 'x', title: 'X', values: '0', dataType: 'number'}

    // ];
    type = 'object';
  }

  //Choose a type
  if (type && type.indexOf('|') >= 0) {
    type = type.indexOf('object') >= 0 ? 'object' : type.split('|')[0];
  }

  if (
    !ws.isNull(properties.custom) &&
    !ws.isNull(properties.custom.minValue) &&
    !ws.isNull(properties.custom.maxValue) &&
    !ws.isNull(properties.custom.step)
  ) {
    type = 'range';
  }

  if (type && type.indexOf('array') === 0) {
    properties.subType = type.substr(6, type.length - 7);
    type = 'array';

    if (properties.subType === 'object') {
      deduceObject();
    }
  }

  if (type === 'object') {
    deduceObject();
  }

  if (!properties.tooltip && !properties.tooltipText) {
    nohint = true;
  } else {
    // properties.tooltip = properties.tooltip.replace(/\n/g, '<br/><br/>');
  }

  
  if (ws.onPhone()) {
    ws.dom.on(help, 'click', function() {
      var hide = ws.Tooltip(0, 0, properties.tooltip || properties.tooltipText, true);
      ws.dom.on([help], 'mouseout', hide);
    });
  } else {
    ws.dom.on([help], 'mouseover', function(e) {
      var hide = ws.Tooltip(
        e.clientX + 20,
        e.clientY,
        properties.tooltip || properties.tooltipText
      );
      
      ws.dom.on([help], 'mouseout', hide);
      // ws.showDimmer(ws.hideAllTooltips, true, true);
    });
  }

  if (nohint) {
    ws.dom.style(help, { display: 'none' });
    widgetTD.colSpan = 2;
  }

  typeIndicator.className += ' ws-customize-type-' + type;
  const parent = ws.dom.cr('div', 'ws-customizer-table-parent', '', fieldID + '_container');
  
  ws.dom.style(parent,
  {
    width: (properties.width || 100) + '%'
  });

  
  if (type === 'header') {   
    
    return ws.dom.ap(
      ws.dom.ap(
        parent, //tr
        ws.dom.ap(widgetTD, fields[type] ? fields[type]() : fields.string())
      )
    );

  }
  else if (type === 'boolean') {
    titleCol.className = 'ws-customize-field-boolean';
    return ws.dom.ap(
      ws.dom.ap(
        parent, //tr
        ws.dom.ap(widgetTD,
          ws.dom.ap(fields[type] ? fields[type]() : fields.string(),
          ws.dom.ap(
            titleCol,
            ws.dom.cr('span', 'ws-customize-field-label', properties.title),
            !nohint
            ? ws.dom.ap(
                helpTD,
                //ws.dom.cr('span', 'ws-field-tooltip', properties.tooltip)
                help
              )
            : false
          ))
      )
      )
    ); 
  } else {
    return ws.dom.ap(
      ws.dom.ap(
        parent, //tr
        ws.dom.ap(
          titleCol,
          ws.dom.cr('span', 'ws-customize-field-label', properties.title),
          !nohint
          ? ws.dom.ap(
              helpTD,
              //ws.dom.cr('span', 'ws-field-tooltip', properties.tooltip)
              help
            )
          : false
        ),
        ws.dom.ap(widgetTD, fields[type] ? fields[type]() : fields.string())
      )
    );
  }

};
