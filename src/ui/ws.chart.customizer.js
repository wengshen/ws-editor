

// @format

/** UI For customizing a chart
 *  @todo there be dragons here.
 *  @example
 *  var chart = ws.ChartCustomizer(document.body, {}, chartPreview);
 *
 *  @constructor
 *
 *  @emits PropertyChange - when a property changes
 *    > {string} - the path of the change
 *    > {anything} - the new value
 *    > {number} - the change array index
 *
 *  @param parent {domnode} - the node to attach the editor to
 *  @param attributes {object} - the attributes
 *    > noAdvanced {bool} - set to true to force disable the advance view
 *    > noCustomCode {bool} - set to true to disable custom code view
 *    > noPreview {bool} - set to true to disable option preview view
 *    > availableSettings {string|array} - whitelist of exposed settings
 *  @param chartPreview {ChartPreview} - the chart preview instance
 */
ws.ChartCustomizer = function(parent, attributes, chartPreview, planCode) {
  var properties = ws.merge(
      {
        noAdvanced: false,
        noCustomCode: false,
        noPreview: false,
        availableSettings: []
      },
      attributes
    ),
    events = ws.events(),
    advancedLoader = ws.dom.cr(
      'div',
      'ws-customizer-adv-loader',
      '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i> Loading'
    ),
    tabs = ws.TabControl(parent, false, null, true), //Quck fix for now, will change once design finalised.
    simpleTab = tabs.createTab({
      title: ws.getLocalizedStr('customizeSimple')
    }),
    advancedTab = tabs.createTab({
      title: ws.getLocalizedStr('customizeAdvanced')
    }),
    customCodeTab = tabs.createTab({
      title: ws.getLocalizedStr('customizeCustomCode')
    }),
    outputPreviewTab = tabs.createTab({
      title: ws.getLocalizedStr('customizePreview')
    }),
    previewEditor = ws.dom.cr(
      'textarea',
      'ws-custom-code ws-box-size ws-stretch'
    ),
    previewCodeMirror = false,
    splitter = ws.dom.cr('div', 'ws-box-simple-container'),
    allOptions,
/*
    splitter = ws.HSplitter(simpleTab.body, {
      leftWidth: 100,
      rightWidth: 100,
      responsive: true
    }),
    */
    list = ws.List(splitter, true, properties, planCode),
    body = ws.dom.cr('div'),//splitter.right,
    advSplitter = ws.HSplitter(advancedTab.body, {
      leftWidth: 30
    }),
    advBody = advSplitter.right,
    advTree = ws.Tree(advSplitter.left),
    flatOptions = {},
    chartOptions = {},
    customCodeSplitter = ws.VSplitter(customCodeTab.body, {
      topHeight: 90
    }),
    customCodeDebug = ws.dom.cr('pre', 'ws-custom-debug'),
    codeMirrorBox = false,
    customCodeBox = ws.dom.cr(
      'textarea',
      'ws-custom-code ws-box-size ws-stretch'
    ),
    highlighted = false;

  //If we're on mobile, completely disable the advanced view
  if (ws.onPhone()) {
    properties.noAdvanced = true;
    properties.noCustomCode = true;
    properties.noPreview = true;
  }

  body.className += ' ws-customizer-body';

  properties.availableSettings = ws.arrToObj(properties.availableSettings);
  ws.dom.ap(simpleTab.body, splitter);
  ws.dom.ap(parent, advancedLoader);
  ws.dom.ap(outputPreviewTab.body, previewEditor);

  ///////////////////////////////////////////////////////////////////////////

  advancedTab.on('Focus', function() {
    buildTree();
  });

  outputPreviewTab.on('Focus', function() {
    var prev = chartPreview.options.getPreview();

    if (!previewCodeMirror && typeof window.CodeMirror !== 'undefined') {
      previewCodeMirror = CodeMirror.fromTextArea(previewEditor, {
        lineNumbers: true,
        mode: 'application/javascript',
        theme: ws.option('codeMirrorTheme'),
        readOnly: true
      });

      previewCodeMirror.setSize('100%', '100%');
    }

    if (previewCodeMirror) {
      previewCodeMirror.setValue(prev);
    } else {
      previewEditor.readonly = true;
      previewEditor.value = prev;
    }
  });

  function loadCustomCode() {
    var code;

    if (chartPreview) {
      code = chartPreview.getCustomCode() || '';
      if (codeMirrorBox) {
        codeMirrorBox.setValue(code);
      } else {
        customCodeBox.value = code;
      }
    }
  }

  /**
   * Init the custom code stuff
   */
  function initCustomCode() {
    // Build the custom code tab
    ws.dom.ap(customCodeSplitter.top, customCodeBox);
    ws.dom.ap(customCodeSplitter.bottom, customCodeDebug);

    function setCustomCode() {
      ws.emit('UIAction', 'CustomCodeUpdate');
      customCodeDebug.innerHTML = '';
      if (chartPreview) {
        
        chartPreview.on('LoadCustomCode', function(options) {
          var code;

          if (chartPreview) {
            code = chartPreview.getCustomCode() || '';
            if (codeMirrorBox) {
              codeMirrorBox.setValue(code);
            } else {
              customCodeBox.value = code;
            }
          }
        });

        chartPreview.on('UpdateCustomCode', function() {
          chartPreview.setCustomCode(
            codeMirrorBox ? codeMirrorBox.getValue() : customCodeBox.value,
            function(err) {
              customCodeDebug.innerHTML = err;
            }
          );
        });

        chartPreview.setCustomCode(
          codeMirrorBox ? codeMirrorBox.getValue() : customCodeBox.value,
          function(err) {
            customCodeDebug.innerHTML = err;
          }
        );
      }
    }

    var timeout = null;

    if (typeof window['CodeMirror'] !== 'undefined') {
      codeMirrorBox = CodeMirror.fromTextArea(customCodeBox, {
        lineNumbers: true,
        mode: 'application/javascript',
        theme: ws.option('codeMirrorTheme')
      });
      codeMirrorBox.setSize('100%', '100%');
      codeMirrorBox.on('change', function() {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          setCustomCode();
        }, 500);
      });
    } else {
      ws.dom.on(customCodeBox, 'change', function() {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          setCustomCode();
        }, 500);
      });
    }
  }

  /** Force a resize of the editor
   *  @memberof ws.ChartCustomizer
   *  @param w {number} - the new width
   *  @param h {number} - the new height
   */
  function resize(w, h) {
    var bsize, lsize;
    tabs.resize(w, h);
    bsize = tabs.barSize();

    list.resize(w, h - bsize.h);
    //splitter.resize(w, h - bsize.h - 10);

    //The customize body needs to have a min-height of the list height
    lsize = ws.dom.size(list.container);

    ws.dom.style(body, {
      minHeight: lsize.h + 'px'
    });
    customCodeSplitter.resize(w, h);

    if (codeMirrorBox) {
      codeMirrorBox.refresh();
    }
  }

  /** Init the customizer
   *  @memberof ws.ChartCustomizer
   *  @param foptions {object} - the customized options
   *  @param coptions {object} - the full chart options
   */
  function init(foptions, coptions, chartp) {
    flatOptions = coptions || {};
    chartOptions = ws.merge({}, foptions || {});
    list.reselect();
    // buildTree();
    chartPreview = chartp || chartPreview;

    customCodeSplitter.resize();
    loadCustomCode();
  }

  function shouldInclude(group) {
    var doInclude = false;

    if (Object.keys(properties.availableSettings || {}).length > 0) {
      if (ws.isArr(group)) {
        group.forEach(function(sub) {
          if (shouldInclude(sub)) {
            doInclude = true;
          }
        });
      } else if (ws.isArr(group.options)) {
        group.options.forEach(function(sub) {
          if (shouldInclude(sub)) {
            doInclude = true;
          }
        });
      } else if (
        properties.availableSettings[group.id] ||
        properties.availableSettings[group.pid]
      ) {
        doInclude = true;
      }

      return doInclude;
    }

    return true;
  }

  function buildTree() {

    if (properties.noAdvanced) {
      return;
    }

    ws.dom.style(advancedLoader, {
      opacity: 1
    });

    if (properties.noAdvanced || ws.isNull(ws.meta.optionsAdvanced)) {
      advancedTab.hide();
    } else {
      
      setTimeout(function() {
        
        ws.meta.optionsAdvanced = ws.transform.advanced(
          ws.meta.optionsAdvanced,
          true
        );

        const series = chartPreview.options.all().series;
        allOptions = ws.merge({}, chartPreview.options.full);//ws.merge({}, chartPreview.options.getCustomized());
        if (series && series.length > 0) {
          series.forEach(function(serie, i) {
            if (allOptions.series && allOptions.series[i]){
              ws.merge(allOptions.series[i], {
                type: serie.type || 'line'
              });
            }
          });
          advTree.build(
            ws.meta.optionsAdvanced,
            allOptions
          );
  
          ws.dom.style(advancedLoader, {
            opacity: 0
          });
          events.emit("AdvancedBuilt");
        }

      }, 10);
    }
  }

  function build() {
    Object.keys(ws.meta.optionsExtended.options).forEach(function(key) {
      if (!shouldInclude(ws.meta.optionsExtended.options[key])) {
        return;
      }
      list.addItem({
        id: key,
        title: ws.L(key)
      }, 
      ws.meta.optionsExtended.options[key],
      chartPreview);
    });
/*
    list.addItem({
      id: "Annotations",
      annotations: true,
      title: "Annotations ",
      onClick: function() {
        events.emit("AnnotationsClicked");
      }
    }, null, chartPreview);*/

    // buildTree();
  }

  //Highlight a node
  function highlightNode(n, x, y) {
    if (!n) return;

    var p = ws.dom.pos(n);

    if (!simpleTab.selected) {
      simpleTab.focus();
    }

    n.focus();
    /*
    n.scrollIntoView({
      inline: 'nearest'
    });*/

    // Draw a dot where the item was clicked
    
    var attention = ws.dom.cr('div', 'ws-attention');
    ws.dom.style(attention, {
      width: '10px',
      height: '10px',
      left: x - 5 + 'px',
      top: y - 5 + 'px',
      borderRadius: '50%'
    });
    ws.dom.ap(document.body, attention);

    // Animate it to the corresponding element
    var pos = Highcharts.offset(n);

    var bgColor = n.style.backgroundColor;
    
    ws.dom.style(attention, {
      width: n.clientWidth + 'px',
      height: n.clientHeight + 'px',
      borderRadius: 0,
      left: pos.left + 'px',
      top: pos.top + 'px'
    });


    window.setTimeout(function() {
      ws.dom.style(n, {
        backgroundColor: window.getComputedStyle(attention).backgroundColor,
        transition: '1s ease background-color'
      });

      attention.parentNode.removeChild(attention);
      attention = null;

      window.setTimeout(function() {
        ws.dom.style(n, {
          backgroundColor: bgColor
        });
      }, 250);
    }, 350);
  }

  //////////////////////////////////////////////////////////////////////////////
  // P U B L I C  F U N S

  /** Highlight a field in the customizer
   *  @memberof ws.ChartCustomizer
   *  @param id {string} - is the id of the field to highlight
   *  @param x {number} - the x coordinate where the focus was triggered
   *  @param y {number} - the y coordinate where the focus was triggered
   */
  function highlightField(id, x, y) {
    if (id.indexOf('-') >= 0) {
      var n = advSplitter.left.querySelector(
        '#' + id.substr(0, id.indexOf('-'))
      );

      highlightNode(simpleTab.body.querySelector('#' + id), x, y);
      highlightNode(advSplitter.right.querySelector('#' + id));

      if (n) {
        n.scrollIntoView({
          block: 'end'
        });
      }
    }
  }

  /** Focus a category
   *  @memberof ws.ChartCustomizer
   *  @param thing {anything} - the category to focus
   *  @param x {number} - the x coordinate where the focus was triggered
   *  @param y {number} - the y coordinate where the focus was triggered
   */
  function focus(thing, x, y) {
    var n;
    list.select(thing.tab);
    list.selectDropdown(thing.dropdown);
  
    advTree.expandTo(thing.id);
    highlightField(thing.id, x, y);
  }

  ///////////////////////////////////////////////////////////////////////////

  list.on('PropertyChange', function(groupId, newValue, detailIndex) {
    events.emit("PropertyChange", groupId, newValue, detailIndex);
  });

  list.on('TogglePlugins', function(groupId, newValue) {
    events.emit("TogglePlugins", groupId, newValue);
  });

  list.on('Select', function(id) {
    var entry = ws.meta.optionsExtended.options[id];
    body.innerHTML = '';
    entry.forEach(function(thing) {
      //selectGroup(thing);
    });
    highlighted = false;
    ws.emit('UIAction', 'SimplePropCatChoose', id);
  });

  function buildAdvTree(item, selected, instancedData, filter, propFilter) {
    var table = ws.dom.cr('table', 'ws-customizer-table'),
      componentCount = 0;

    advBody.innerHTML = '';

    if (properties.noAdvanced) {
      return;
    }

    item.children.forEach(function(entry) {
      if (!entry.meta.leafNode) {
        return;
      }

      // Skip functions for now
      if (Object.keys(entry.meta.types)[0] === 'function') {
        return;
      }

      if (propFilter && entry.meta.validFor) {
        if (!entry.meta.validFor[propFilter]) {
          // console.log('filtered', entry.meta.name, 'based on', propFilter);
          return false;
        }
      }

      if (
        filter &&
        entry.meta.products &&
        Object.keys(entry.meta.products) > 0 &&
        !entry.meta.products[filter]
      ) {
        return;
      }

      componentCount++;
      entry.values = entry.meta.enumValues;
      ws.dom.ap(
        table,
        ws.InspectorField(
          entry.values
            ? 'options'
            : Object.keys(entry.meta.types)[0] || 'string',
          typeof instancedData[entry.meta.name] !== 'undefined'
            ? instancedData[entry.meta.name]
            : entry.meta.default, //(ws.getAttr(chartOptions, entry.id)  || entry.defaults),
          {
            title: ws.uncamelize(entry.meta.name),
            tooltip: entry.meta.description,
            values: entry.meta.enumValues,
            defaults: entry.meta.default,
            custom: {},
            attributes: entry.attributes || []
          },
          function(newValue) {
            if (typeof newValue === 'string') newValue = newValue.replace('</script>', '<\\/script>'); //Bug in cloud
            ws.emit(
              'UIAction',
              'AdvancedPropSet',
              (entry.meta.ns ? entry.meta.ns + '.' : '') + ws.uncamelize(entry.meta.name),
              newValue
            );
            instancedData[entry.meta.name] = newValue;
            events.emit('PropertySetChange', advTree.getMasterData());
            if (advTree.isFilterController(entry.meta.ns, entry.meta.name)) {
              buildTree();
            }
          },
          false,
          entry.meta.name,
          planCode
        )
      );
    });

    ws.dom.ap(
      advBody,
      ws.dom.ap(
        ws.dom.cr('div', 'ws-customize-group ws-customize-advanced'),
        ws.dom.cr('div', 'ws-customizer-table-heading', selected),
        table
      )
    );
  }

  advTree.on('ForceSave', function(data) {
    events.emit('PropertySetChange', data);
  });

  advTree.on('ClearSelection', function() {
    advBody.innerHTML = '';
  });

  advTree.on('Select', buildAdvTree);

  advTree.on('DataUpdate', function(path, data) {
    events.emit('PropertyChange', path, data);
  });

  advTree.on('Dirty', function() {
    init(flatOptions, chartOptions);
  });

  tabs.on('Focus', function() {
    init(flatOptions, chartOptions);
  });

  build();
  initCustomCode();

  if (properties.noCustomCode) {
    customCodeTab.hide();
  }

  if (properties.noAdvanced) {
    advancedTab.hide();
  }

  if (properties.noPreview) {
    outputPreviewTab.hide();
  }

  function showCustomCode() {
    customCodeTab.focus();
  }

  function showSimpleEditor() {
    simpleTab.focus();
  }

  function showPreviewOptions() {
    outputPreviewTab.focus();
  }

  function showAdvancedEditor() {
    events.emit("AdvanceClicked");
    advancedTab.focus();
  }

  function getAdvancedOptions() {
    return allOptions;
  }
  return {
    /* Listen to an event */
    on: events.on,
    resize: resize,
    init: init,
    focus: focus,
    reselect: list.reselect,
    highlightField: highlightField,
    showCustomCode: showCustomCode,
    showSimpleEditor: showSimpleEditor,
    showAdvancedEditor: showAdvancedEditor,
    showPreviewOptions: showPreviewOptions,
    getAdvancedOptions: getAdvancedOptions
  };
};
