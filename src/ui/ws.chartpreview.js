

// @format

/** Basic chart preview
 *  This is just a facade to Highcharts.Chart mostly.
 *  It implements a sliding drawer type widget,
 *  where the initial state can be as part of the main DOM,
 *  and where the expanded state covers most of the screen (90%)
 *
 *  @todo this is a proper mess right now - need a good refactoring
 *
 *  @constructor
 *
 *  @param parent {domnode} - the node to attach the preview to
 *  @param attributes {object} - the settings
 *    > defaultChartOptions {object} - the default chart options
 */
ws.ChartPreview = function(parent, attributes) {
  var properties = ws.merge(
      {
        defaultChartOptions: {
          title: {
            text: 'Chart Title'
          },
          subtitle: {
            text: ''
          },
          exporting: {
            //   url: 'http://127.0.0.1:7801'
          }
        },
        expandTo: parent
      },
      attributes
    ),
    events = ws.events(),
    customizedOptions = {},
    aggregatedOptions = {},
    flatOptions = {},
    templateOptions = [],
    chartOptions = {},
    themeOptions = {},
    themeCustomCode = '',
    themeMeta = {},
    exports = {},
    chartPlugins = {},
    customCodeDefault = [
      '/*',
      '// Sample of extending options:',
      'Highcharts.merge(true, options, {',
      '    chart: {',
      '        backgroundColor: "#bada55"',
      '    },',
      '    plotOptions: {',
      '        series: {',
      '            cursor: "pointer",',
      '            events: {',
      '                click: function(event) {',
      '                    alert(this.name + " clicked\\n" +',
      '                          "Alt: " + event.altKey + "\\n" +',
      '                          "Control: " + event.ctrlKey + "\\n" +',
      '                          "Shift: " + event.shiftKey + "\\n");',
      '                }',
      '            }',
      '        }',
      '    }',
      '});',
      '*/'
    ].join('\n'),
    customCode = '',
    customCodeStr = '',
    lastLoadedCSV = false,
    lastLoadedSheet = false,
    lastLoadedLiveData = false,
    throttleTimeout = false,
    chart = false,
    preExpandSize = false,
    dataTableCSV = null,
    assignDataFields = null,
    templateSettings = {},
    toggleButton = ws.dom.cr(
      'div',
      'ws-icon ws-chart-preview-expand fa fa-external-link-square'
    ),
    expanded = false,
    constr = ['Chart'],
    wysiwyg = {
      'g.highcharts-legend': { tab: 'Legend', dropdown: 'General', id: 'legend--enabled' },
      'text.highcharts-title': { tab: 'Chart',  dropdown: 'Title', id: 'title--text' },
      'text.highcharts-subtitle': { tab: 'Chart', dropdown: 'Title',id: 'subtitle--text' },
      '.highcharts-yaxis-labels': { tab: 'Axes', dropdown: 'Y Axis', id: 'yAxis-labels--format' },
      '.highcharts-xaxis-labels': { tab: 'Axes', dropdown: 'X Axis', id: 'xAxis-labels--format' },
      '.highcharts-xaxis .highcharts-axis-title': {
        tab: 'Axes', 
        dropdown: 'X Axis',
        id: 'xAxis-title--text'
      },
      '.highcharts-yaxis .highcharts-axis-title': {
        tab: 'Axes',
        dropdown: 'Y Axis',
        id: 'yAxis-title--text'
      },
      'rect.highcharts-background': {
        tab: 'Chart',
        dropdown: 'Appearance',
        id: 'chart--backgroundColor'
      },
      '.highcharts-series': { tab: 'Data series', id: 'series' },
      'g.highcharts-tooltip': { tab: 'Chart', dropdown: 'Tooltip', id: 'tooltip--enabled' }
    },
    isAnnotating = false,
    annotationType = false;

  ///////////////////////////////////////////////////////////////////////////

  function attachWYSIWYG() {
    
    Object.keys(wysiwyg).forEach(function(key) {
      ws.dom.on(parent.querySelector(key), 'click', function(e) {
        if (isAnnotating) return;
        events.emit('RequestEdit', wysiwyg[key], e.clientX, e.clientY);
        e.cancelBubble = true;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      });
    });
  }

  function stringifyFn(obj, tabs) {
    return JSON.stringify(
      obj,
      function(key, value) {
        if (ws.isFn(value)) {
          return value.toString();
        }

        return value;
      },
      tabs
    );
  }

  /* Get the chart if it's initied */
  function gc(fn) {
    if (ws.isFn(fn)) {
      if (chart !== false) {
        return fn(chart);
      }
      return fn(init());
    }
    return false;
  }

  /* Emit change events */
  function emitChange() {
    events.emit('ChartChange', aggregatedOptions);

    //Throttled event - we use this when doing server stuff in the handler
    //since e.g. using the color picker can result in quite a lot of updates
    //within a short amount of time
    window.clearTimeout(throttleTimeout);
    throttleTimeout = window.setTimeout(function() {
      events.emit('ChartChangeLately', aggregatedOptions);
    }, 200);
  }

  function addShape(chart, type, x, y) {
    var options = {
        id: "shape_" + customizedOptions.annotations.length, //customizedOptions.annotations[0].shapes.length,
        type: type,
        point: {
            x: x,
            y: y,
            xAxis: 0,
            yAxis: 0
        },
        x: 0,
        y: 0
    };

    if (type === 'circle') {
        options.r = 10;
    } else if (type === 'rect') {
        options.width = 20;
        options.height = 20;
        options.x = -10;
        options.y = -10;
    }


    var annotation = chart.addAnnotation({
      id: "shape_" + customizedOptions.annotations.length, //customizedOptions.annotations[0].shapes.length,
      shapes: [options],
      type: type
    });
    
    var annotation = chart.addAnnotation({
        id: "shape_" + customizedOptions.annotations.length, //customizedOptions.annotations[0].shapes.length,
        shapes: [options],
        type: type
    });

    customizedOptions.annotations.push({ 
      id: "shape_" + customizedOptions.annotations.length,
      shapes: [annotation.options.shapes[0]]
    });
    //customizedOptions.annotations[0].shapes.push(annotation.options.shapes[0]);
  }

  /* Init the chart */
  function init(options, pnode, noAnimation) {
    var i;

    //We want to work on a copy..
    options = options || aggregatedOptions;

    if (ws.isArr(constr)) constr = constr;
    else constr = ['Chart'];

    // options = ws.merge({}, options || aggregatedOptions);

    // if (aggregatedOptions && aggregatedOptions.series) {
    //     options = aggregatedOptions.series;
    // }

    if (noAnimation) {
      ws.setAttr(options, 'plotOptions--series--animation', false);
    }

    if (typeof window.Highcharts === 'undefined') {
      ws.snackBar('Highcharts.JS must be included to use the editor');
      return;
    }

    // (pnode || parent).innerHTML = 'Chart not loaded yet';

    // options.chart = options.chart || {};
    // options.chart.width = '100%';
    // options.chart.height = '100%';

    // if (options && options.chart) {
    //   delete options.chart.width;
    //   delete options.chart.height;
    // }


    if (chart && chart.annotations) {
      var annotations = chart.annotations || [];
      for (var i = annotations.length - 1; i > -1; --i) {
        if (annotations[i].options) {
          chart.removeAnnotation(annotations[i].options.id);
        }
      }
      chart.annotations.length = 0;
    }
    
    try {
      const chartConstr = (constr.some(function(a) {
        return a === 'StockChart';
      }) ? 'StockChart' : 'Chart');

      chart = new Highcharts[chartConstr](pnode || parent, options);

      //This is super ugly.
      // customizedOptions.series = customizedOptions.series || [];
      //  customizedOptions.series = chart.options.series || [];
      // ws.merge(customizedOptions.series, chart.options.series);
      //updateAggregated();

      if (chart && chart.options) {
        ws.clearObj(chartOptions);
        ws.merge(chartOptions, chart.options);
      }

      attachWYSIWYG();

      if (chart && chart.reflow) {
        //chart.reflow();
      }

      Highcharts.error = function (code, stopLoading) {
        if (stopLoading) throw code;
        else {      
          setTimeout(function() {
            events.emit('Error', {
              code: code,
              url : (code ? 'https://www.highcharts.com/errors/' + code : ''),
              warning: true
            });  
          }, 200);
        }
      };

      function setupAnnotationEvents(eventName, type) {
        Highcharts.wrap(Highcharts.Annotation.prototype, eventName, function(proceed, shapeOptions) {
          proceed.apply(this, Array.prototype.slice.call(arguments, 1))
          var annotation = this[type][this[type].length - 1];
          
          (annotation.element).addEventListener('click', function(e) {
            ws.dom.nodefault(e);
            if (isAnnotating && annotationType === 'delete') {
              var optionIndex = customizedOptions.annotations.findIndex(function(element) {
                return element.id === annotation.options.id
              });

              chart.removeAnnotation(annotation.options.id);
              customizedOptions.annotations.splice(optionIndex, 1);

            }
          });

          (annotation.element).addEventListener('mousedown', function(e) {
            if (!chart.activeAnnotation && (isAnnotating && annotationType === 'drag')) {
              if (type === 'shapes') {
                chart.activeAnnotationOptions = ws.merge({}, annotation.options);
                if (annotation.type === 'rect') {
                  chart.activeAnnotationOptions.width = 20;
                  chart.activeAnnotationOptions.height = 20;
                }
              } else {
                chart.activeAnnotationOptions = {
                  id: annotation.options.id,
                  text: annotation.options.text,
                  point: { 
                    x: annotation.options.point.x, 
                    y: annotation.options.point.y,            
                    xAxis: 0,
                    yAxis: 0 
                  },
                  backgroundColor: annotation.options.backgroundColor,
                  shape: annotation.options.shape,
                  borderWidth: annotation.options.borderWidth,
                  x: 0,
                  y: 0
                };
              }
              annotation.id = annotation.options.id;
              chart.activeAnnotation = annotation;
              chart.annotationType = type;
            }
          });
        })
      }

      setupAnnotationEvents('initLabel', 'labels');
      setupAnnotationEvents('initShape', 'shapes');


      Highcharts.addEvent(document, 'mousemove', function (e) {
        if (!chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) return;

        if (chart.activeAnnotationOptions && (isAnnotating && annotationType === 'drag')) {
          var s = chart.pointer.normalize(e),
              prevOptions = chart.activeAnnotationOptions,
              prevAnn = chart.activeAnnotation;
          
          prevOptions.point.x = chart.xAxis[0].toValue(s.chartX);
          prevOptions.point.y = chart.yAxis[0].toValue(s.chartY);
          
          if(prevAnn && prevAnn.id) {
            chart.removeAnnotation(prevAnn.id);
          }
            
          var newAnnotation;
          if (chart.annotationType === 'shapes') {
            newAnnotation = chart.addAnnotation({
                id: prevOptions.id,
                shapes: [prevOptions]
            });
          } else {
            newAnnotation = chart.addAnnotation({
              id: prevOptions.id,
              labels: [prevOptions]
            });
          }
          newAnnotation.id = prevOptions.id;
          chart.activeAnnotation = newAnnotation;
        }
      });
      
      Highcharts.addEvent(document, 'mouseup', function (e) {
        if (chart.activeAnnotation && (isAnnotating && annotationType === 'drag')) {

          chart.removeAnnotation(chart.activeAnnotationOptions.id);

          if (chart.annotationType === 'shapes') {

            chart.activeAnnotation = chart.addAnnotation({
              id: chart.activeAnnotationOptions.id,
              shapes: [chart.activeAnnotationOptions]
            });

            customizedOptions.annotations.some(function(ann) {
              if (ann.shapes && ann.shapes[0].id === chart.activeAnnotationOptions.id) {
                ann.shapes[0].point.x = chart.activeAnnotation.options.shapes[0].point.x;
                ann.shapes[0].point.y = chart.activeAnnotation.options.shapes[0].point.y;
                return true;
              }
            });

          } else {
            chart.activeAnnotation = chart.addAnnotation({
              id: chart.activeAnnotationOptions.id,
              labels: [chart.activeAnnotationOptions]
            });

            customizedOptions.annotations.some(function(ann) {
              if (ann.labels && ann.labels[0].id === chart.activeAnnotationOptions.id) {
                ann.labels[0].point.x = chart.activeAnnotation.options.labels[0].point.x;
                ann.labels[0].point.y = chart.activeAnnotation.options.labels[0].point.y;
                return true;
              }
            });
          }
          chart.activeAnnotation = null;
          chart.activeAnnotationOptions = null;
          chart.annotationType = null;
        }
      });

      Highcharts.addEvent(chart, 'click', function (e) {
        if (isAnnotating) {
          //events.emit('SetAnnotate', e);

          if (!customizedOptions.annotations) customizedOptions.annotations = []; //[{}];
          //if (!customizedOptions.annotations[0].shapes) customizedOptions.annotations[0].shapes = []; 

          if (annotationType === 'label') {
            events.emit('ShowTextDialog', this, e.xAxis[0].value, e.yAxis[0].value);
          } else if (annotationType === 'delete' || annotationType === 'drag'){
          } else {
            addShape(this, annotationType, e.xAxis[0].value, e.yAxis[0].value);
          }
        }
      });

      Highcharts.addEvent(chart, 'afterPrint', function() {
        events.emit('RequestResize');
        // ws.dom.ap(pnode || parent, toggleButton);
      });

      events.emit('ChartRecreated');
    } catch (code) {
      events.emit('Error', {
        code: code,
        url : (code ? 'https://www.highcharts.com/errors/' + code : '')
      });

      ws.emit('UIAction', 'UnsuccessfulChartGeneration');

      (pnode || parent).innerHTML = '';  
      
      chart = false;
    }

    return chart;
  }

  /** Resize the preview
   *  Resizes based on the parent size.
   *  @memberof ws.ChartPreview
   */
  function resize(width, height) {
    gc(function(chart) {

      if (chart && chart.reflow) {
        // && chart.options) {
        try {
          if (width && height) {
            chart.setSize(width, height, true);
            chart.options.chart.width = null;
            chart.options.chart.height = null;
          } else {
            chart.setSize(undefined, undefined, false);
            chart.reflow();
          }
        } catch (e) {
          // No idea why this keeps failing
        }
      }
    });
  }

  /**
   * Clear all themes from the chart.
   * Used by cloud to reset theme
   */
  function clearTheme(theme, skipEmit) {
    themeOptions = false;

    if (!skipEmit) {
      updateAggregated();
      init(aggregatedOptions);
      emitChange();
      events.emit('SetResizeData');
    }

    return true;
  }

  /**
   * Assign a theme to the chart
   * theme can either be a straight-up option set, or a theme object with
   * ID and so on.
   */
  function assignTheme(theme, skipEmit) {
    if (ws.isStr(theme)) {
      return assignTheme(JSON.parse(theme));
    }
    themeMeta = {};

    if (ws.isBasic(theme) || ws.isArr(theme)) {
      return false;
    }

    if (Object.keys(theme).length === 0) {
      return false;
    }

    if (theme && theme.options && theme.id) {
      // Assume that this uses the new format
      themeMeta = {
        id: theme.id,
        name: theme.name || theme.id
      };

      themeOptions = ws.merge({}, theme.options);
      themeCustomCode = theme.customCode || '';
    } else {
      themeMeta = {
        id: ws.uuid(),
        name: 'Untitled Theme'
      };

      themeOptions = ws.merge({}, theme);
    }

    if (!skipEmit) {
      events.emit('UpdateCustomCode');
      updateAggregated();
      init(aggregatedOptions);
      emitChange();
      events.emit('SetResizeData');
    }

    return true;
  }

  function updateAggregated(noCustomCode) {
    // customizedOptions.plotOptions = customizedOptions.plotOptions || {};
    // customizedOptions.plotOptions.series = customizedOptions.plotOptions.series || [];
    //  customizedOptions.series = customizedOptions.series || [];

    if (
      customizedOptions &&
      !ws.isArr(customizedOptions.yAxis) &&
      customizedOptions.yAxis
    ) {
      customizedOptions.yAxis = [customizedOptions.yAxis || {}];
    }

    if (
      customizedOptions &&
      !ws.isArr(customizedOptions.xAxis) &&
      customizedOptions.xAxis
    ) {
      customizedOptions.xAxis = [customizedOptions.xAxis || {}];
    }

   // templateOptions = templateOptions || {};
    templateOptions = templateOptions || [];
    var aggregatedTemplate = {}; 


    //Merge fest

    ws.clearObj(aggregatedOptions);

    ws.merge(aggregatedOptions, properties.defaultChartOptions);

    // Apply theme first
    if (themeOptions && Object.keys(themeOptions).length) {
      ws.merge(
        aggregatedOptions,
        ws.merge(ws.merge({}, themeOptions))
      );
    }

    templateOptions.forEach(function(arr) {
      if (arr) {
        if (arr.yAxis && !ws.isArr(arr.yAxis)) {
          arr.yAxis = [arr.yAxis];
        }
  
        if (arr.xAxis && !ws.isArr(arr.xAxis)) {
          arr.xAxis = [arr.xAxis];
        }
  
        aggregatedTemplate = ws.merge(aggregatedTemplate, arr);
      }
    });

    ws.merge(
      aggregatedOptions,
      ws.merge(ws.merge({}, aggregatedTemplate), customizedOptions)
    );

    if (!aggregatedOptions.yAxis && customizedOptions.yAxis) {
      aggregatedOptions.yAxis = customizedOptions.yAxis
    }

    if (!aggregatedOptions.xAxis && customizedOptions.xAxis) {
      aggregatedOptions.xAxis = customizedOptions.xAxis
    }

    //This needs to be cleaned up
    if (aggregatedOptions.yAxis && aggregatedTemplate.yAxis) {
      aggregatedOptions.yAxis.forEach(function(obj, i) {
        if (i < aggregatedTemplate.yAxis.length) {
          ws.merge(obj, aggregatedTemplate.yAxis[i]);
        }
      });
    }

    if (aggregatedOptions.xAxis && aggregatedTemplate.xAxis && ws.isArr(aggregatedOptions.xAxis)) {
      (aggregatedOptions.xAxis).forEach(function(obj, i) {
        if (i < aggregatedTemplate.xAxis.length) {
          ws.merge(obj, aggregatedTemplate.xAxis[i]);
        }
      });
    }

    if (themeOptions && themeOptions.xAxis) {
      themeOptions.xAxis = ws.isArr(themeOptions.xAxis)
        ? themeOptions.xAxis
        : [themeOptions.xAxis];

      if (ws.isArr(aggregatedOptions.xAxis)) {
        (aggregatedOptions.xAxis).forEach(function(obj, i) {
          if (i < themeOptions.xAxis.length) {
            ws.merge(obj, themeOptions.xAxis[i]);
          }
        });
      }
    }

    if (themeOptions && themeOptions.yAxis) {
      themeOptions.yAxis = ws.isArr(themeOptions.yAxis)
        ? themeOptions.yAxis
        : [themeOptions.yAxis];

      if (ws.isArr(aggregatedOptions.yAxis)) {
        aggregatedOptions.yAxis.forEach(function(obj, i) {
          if (i < themeOptions.yAxis.length) {
            ws.merge(obj, themeOptions.yAxis[i]);
          }
        });
      }
    }

    //Temporary hack
    //aggregatedOptions.series = customizedOptions.series;\
    aggregatedOptions.series = [];
    if (ws.isArr(customizedOptions.series)) {
      customizedOptions.series.forEach(function(obj, i) {
        var mergeTarget = {};

        if (themeOptions && ws.isArr(themeOptions.series)) {
          if (i < themeOptions.series.length) {
            mergeTarget = ws.merge({}, themeOptions.series[i]);
          }
        }

        aggregatedOptions.series.push(ws.merge(mergeTarget, obj));
      });
    }

    if (aggregatedTemplate.series) {
      aggregatedOptions.series = aggregatedOptions.series || [];

      aggregatedTemplate.series.forEach(function(obj, i) {
        if (i < aggregatedOptions.series.length) {
          ws.merge(aggregatedOptions.series[i], obj);
        } else {
          aggregatedOptions.series.push(ws.merge({}, obj));
        }
      });
    }

    ws.merge(
      aggregatedOptions,
      ws.merge({}, customizedOptions)
    );


    if (themeOptions && themeOptions.series) {
      if (aggregatedOptions.series) {
        aggregatedOptions.series.forEach(function (serie, i) {
          if (!serie.type && themeOptions.series[i] && themeOptions.series[i].type) {
            serie.type = themeOptions.series[i].type
          }
        });
      }
    }


    if (aggregatedOptions.yAxis && !ws.isArr(aggregatedOptions.yAxis)) {
      aggregatedOptions.yAxis = [aggregatedOptions.yAxis];
    }

    if (aggregatedOptions.xAxis && !ws.isArr(aggregatedOptions.xAxis)) {
      aggregatedOptions.xAxis = [aggregatedOptions.xAxis];
    }

    ws.merge(aggregatedOptions, ws.option('stickyChartProperties'));

    // Finally, do custom code
    if (!noCustomCode && ws.isFn(customCode)) {
      customCode(aggregatedOptions);
    }

  }


  function deleteSeries(length) {
    if (customizedOptions && customizedOptions.series) {
      customizedOptions.series = customizedOptions.series.slice(0, length);
      updateAggregated();
      init(aggregatedOptions);
      emitChange();
    }
  }

  function deleteSerie(index) {
    
    if (customizedOptions.series && customizedOptions.series[index]) {
      customizedOptions.series.splice(index, 1);
      delete templateSettings[index];
    }

    updateAggregated();
    init(aggregatedOptions);
  }

  function loadTemplateForSerie(template, seriesIndex) {
    const type = template.config.chart.type;
    delete template.config.chart.type;

    constr[seriesIndex] = template.constructor || 'Chart';

    seriesIndex.forEach(function(index) {

      if (!templateSettings[index]) templateSettings[index] = {};

      templateSettings[index].templateTitle = template.title;
      templateSettings[index].templateHeader = template.header;
      
      if (customizedOptions.series[index]) {
        customizedOptions.series[index].type = type; //template.config.chart.type;
      } else {
        customizedOptions.series[index] = {
          type: type, //template.config.chart.type,
          turboThreshold: 0,
          _colorIndex: customizedOptions.series.length,
          _symbolIndex: 0,
          compare: undefined
        };
      }
    });
    
    //templateOptions = ws.merge({}, template.config || {});
    templateOptions[seriesIndex] = ws.merge({}, template.config || {});
    
    updateAggregated();
    init(aggregatedOptions);
    //loadSeries();
    emitChange();
  }

  /** Load a template from the meta
   *  @memberof ws.ChartPreview
   *  @param template - the template object
   */
  function loadTemplate(template) {
    if (!template || !template.config) {
      return ws.log(
        1,
        'chart preview: templates must be an object {config: {...}}'
      );
    }
    
    constr = [template.constructor || 'Chart'];

    //ws.clearObj(templateOptions);

    if (customizedOptions.xAxis) {
      delete customizedOptions.xAxis;
    }

    if (customizedOptions.yAxis) {
      delete customizedOptions.yAxis;
    }

    // ws.setAttr(customizedOptions, 'series', []);
    gc(function(chart) {
      //templateOptions = ws.merge({}, template.config || {});

      templateOptions = [ws.merge({}, template.config || {})];

      updateAggregated();
      init(aggregatedOptions);
      emitChange();
    });
  }


  function loadSeriesFromDataSource(){
    if (
      !gc(function(chart) {
        if (chart.options && chart.options.series) {
          customizedOptions.series = chart.options.series;
        }
        return true;
      })
    ) {
      customizedOptions.series = [];
    }
    updateAggregated();
  }

  function loadSeries() {/*
    if (
      !gc(function(chart) {
        if (chart.options && chart.options.series) {
          customizedOptions.series = chart.options.series;
        }
        return true;
      })
    ) {
      customizedOptions.series = [];
    }
    updateAggregated();*/
  }

  /** Load CSV data
   *  @memberof ws.ChartPreview
   *  @name data.csv
   *  @param data {object} - the data to load
   */
  function loadCSVData(data, emitLoadSignal, bypassClearSeries, cb) {
    var mergedExisting = false,
      seriesClones = [];
    if (!data || !data.csv) {
      if (ws.isStr(data)) {
        data = {
          csv: data,
          // itemDelimiter: ';',
          firstRowAsNames: true
        };
      } else {
        return ws.log(1, 'chart load csv: data.csv is required');
      }
    }

    lastLoadedCSV = data.csv;
    lastLoadedSheet = false;
    lastLoadedLiveData = false;
    gc(function(chart) {
      var axis;

      // ws.setAttr(customizedOptions, 'series', []);
      // ws.setAttr(aggregatedOptions, 'series', []);

      // ws.setAttr(customizedOptions, 'plotOptions--series--animation', true);
      // ws.setAttr(customizedOptions, 'data--csv', data.csv);
      // ws.setAttr(customizedOptions, 'data--googleSpreadsheetKey', undefined);
      // ws.setAttr(customizedOptions, 'data--itemDelimiter', data.itemDelimiter);
      // ws.setAttr(customizedOptions, 'data--firstRowAsNames', data.firstRowAsNames);
      // ws.setAttr(customizedOptions, 'data--dateFormat', data.dateFormat);
      // ws.setAttr(customizedOptions, 'data--decimalPoint', data.decimalPoint);

      if (customizedOptions && customizedOptions.series) {
        (ws.isArr(customizedOptions.series)
          ? customizedOptions.series
          : [customizedOptions.series]
        ).forEach(function(series) {
          seriesClones.push(
            ws.merge({}, series, false, {
              data: 1,
              name: 1
            })
          );
        });
      }
      
      customizedOptions.series = [];

      if (customizedOptions.xAxis) {
        (ws.isArr(customizedOptions.xAxis)
          ? customizedOptions.xAxis
          : [customizedOptions.xAxis]
        ).forEach(function(axis) {
          if (axis.categories) axis.categories = [];
        });
      }

      if (customizedOptions.yAxis) {
        (ws.isArr(customizedOptions.yAxis)
          ? customizedOptions.yAxis
          : [customizedOptions.yAxis]
        ).forEach(function(axis) {
          if (axis.categories) axis.categories = [];
        });
      }

      ws.merge(customizedOptions, {
        plotOptions: {
          series: {
            animation: false
          }
        },
        data: {
          csv: data.csv,
          itemDelimiter: data.itemDelimiter,
          firstRowAsNames: data.firstRowAsNames,
          dateFormat: data.dateFormat,
          decimalPoint: data.decimalPoint,
          googleSpreadsheetKey: undefined,
          url: data.url
        }
      });

      updateAggregated();

      init(aggregatedOptions);
      loadSeries();
      emitChange();

      if (ws.isArr(seriesClones)) {
        (seriesClones || []).forEach(function(series, i) {
          mergedExisting = true;
          if (!customizedOptions.series[i]) {
            addBlankSeries(i);
          }
          ws.merge(customizedOptions.series[i], series);
        });
      }

      if (mergedExisting) {
        updateAggregated();
        init(aggregatedOptions);
        loadSeries();
        emitChange();
      }

      if (emitLoadSignal) {
        events.emit('LoadProjectData', data.csv);
      }

      if (cb) cb();
      
    });

    // setTimeout(function () {
    // gc(function (chart) {
    //   if (chart && ws.isArr(chart.xAxis) && chart.xAxis.length > 0) {
    //     customizedOptions.xAxis = customizedOptions.xAxis || [];
    //     chart.xAxis.forEach(function (a, i) {
    //       customizedOptions.xAxis[i] = customizedOptions.xAxis[i] || {};
    //       if (a.isDatetimeAxis) {
    //         customizedOptions.xAxis[i].type = 'datetime';
    //       } else if (a.categories) {
    //         customizedOptions.xAxis[i].type = 'categories';
    //       } else {
    //         // customizedOptions.xAxis[i].type = 'linear';
    //       }
    //     });
    //   }
    //   console.log(chart);
    // });
    // }, 1000);
  }

  /** Load project
   *  @memberof ws.ChartPreview
   *  @param projectData - the data to load
   */
  function loadProject(projectData) {
    var hasData = false,
      htmlEntities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>'
      };

    ws.emit('UIAction', 'LoadProject');
    
    lastLoadedCSV = false;
    lastLoadedSheet = false;
    lastLoadedLiveData = false;
    
    if (ws.isStr(projectData)) {
      try {
        return loadProject(JSON.parse(projectData));
      } catch (e) {
        ws.snackBar('Invalid project');
      }
    }
    
    if (projectData) {
      templateOptions = [{}];
      if (projectData.template) {
        if (ws.isArr(projectData.template)) templateOptions = projectData.template;
        else templateOptions = [projectData.template];
      }

      customizedOptions = {};
      if (projectData.options) {
        customizedOptions = projectData.options;
      }

      // ws.merge(customizedOptions, {
      //   data: {
      //     csv: undefined
      //   }
      // });

      // if (customizedOptions && customizedOptions.data) {
      //   customizedOptions.data.csv = undefined;
      // }

      if (customizedOptions.lang) {
        Highcharts.setOptions({
          lang: customizedOptions.lang
        });
      }

      if (typeof projectData.theme !== 'undefined') {
        assignTheme(projectData.theme, true);
      }

      if (customizedOptions && customizedOptions.series) {
        customizedOptions.series = ws.isArr(customizedOptions.series)
          ? customizedOptions.series
          : [customizedOptions.series];

        customizedOptions.series.forEach(function(series) {
          if (typeof series._colorIndex !== 'undefined') {
            delete series._colorIndex;
          }
        });
      }

      setCustomCode(
        projectData.customCode,
        function(err) {
          ws.snackBar('Error in custom code: ' + err);
        },
        true
      );

      events.emit('LoadCustomCode');
      
      constr = ['Chart'];

      // Support legacy format
      if (projectData.settings && projectData.settings.templateView) {
        if (projectData.settings.templateView.activeSection === 'stock') {
          constr = ['StockChart'];
        }
      }

      if (projectData.settings && projectData.settings.template) {
        templateSettings = projectData.settings.template;
      }

      if(projectData.settings && projectData.settings.plugins) {
        chartPlugins = projectData.settings.plugins
      }

      if (
        projectData.settings &&
        ws.isStr(projectData.settings.constructor)
      ) {
        constr = [projectData.settings.constructor];
      }

      if (
        projectData.settings &&
        ws.isArr(projectData.settings.constructor)
      ) {
        constr = projectData.settings.constructor;
      }

      if (projectData.settings && projectData.settings.dataProvider) {
        if (projectData.settings.dataProvider.seriesMapping) {
          ws.merge(customizedOptions, {
            data: {
              seriesMapping: projectData.settings.dataProvider.seriesMapping
            }
          });

        }
        
        if (projectData.settings.dataProvider.assignDataFields) {
          assignDataFields = projectData.settings.dataProvider.assignDataFields;
        }

        if (projectData.settings.dataProvider.googleSpreadsheet) {
          var provider = projectData.settings.dataProvider;
          var sheet = provider.googleSpreadsheet;

          if (customizedOptions.data) {
            sheet.startRow =
              provider.startRow || customizedOptions.data.startRow;
            sheet.endRow = provider.endRow || customizedOptions.data.endRow;
            sheet.startColumn =
              provider.startColumn || customizedOptions.data.startColumn;
            sheet.endColumn =
              provider.endColumn || customizedOptions.data.endColumn;
            if (provider.dataRefreshRate && provider.dataRefreshRate > 0) {
              sheet.dataRefreshRate =
                provider.dataRefreshRate ||
                customizedOptions.data.dataRefreshRate;
              sheet.enablePolling = true;
            }
          }

          events.emit(
            'ProviderGSheet',
            projectData.settings.dataProvider.googleSpreadsheet
          );

          loadGSpreadsheet(sheet);

          hasData = true;
        } else if (projectData.settings.dataProvider.liveData) {
          var provider = projectData.settings.dataProvider;
          var live = provider.liveData;

          loadLiveData(provider.liveData);
        } else if (projectData.settings.dataProvider.csv) {
          // We need to fix potential html-entities as they will mess up separators
          Object.keys(htmlEntities).forEach(function(ent) {
            projectData.settings.dataProvider.csv = projectData.settings.dataProvider.csv.replace(
              new RegExp(ent, 'g'),
              htmlEntities[ent]
            );
          });
          hasData = true;
        }
      }

      // Not sure if this should be part of the project files yet
      // if (projectData.editorOptions) {
      //     Object.keys(projectData.editorOptions, function (key) {
      //         ws.option(key, projectData.editorOptions[key]);
      //     });
      // }

        updateAggregated();

        if (!hasData) {
          init(aggregatedOptions); 
        }
        emitChange();
      
      events.emit('LoadProject', projectData, aggregatedOptions);
    }
  }

  function loadLiveData(settings) {

    lastLoadedLiveData = settings;

    lastLoadedCSV = false;
    lastLoadedSheet = false;

    ws.merge(customizedOptions, {
      data: lastLoadedLiveData
    });

    events.emit('ProviderLiveData', settings);
    updateAggregated();
    init(aggregatedOptions);

    loadSeries();
    emitChange();

    // The sheet will be loaded async, so we should listen to the load event.
    gc(function(chart) {
      var found = Highcharts.addEvent(chart, 'load', function() {
        loadSeriesFromDataSource();
        found();
      });
    });

  }

  function loadGSpreadsheet(options) {
    var key;

    lastLoadedCSV = false;
    lastLoadedSheet = options;

    lastLoadedSheet.googleSpreadsheetKey =
      lastLoadedSheet.googleSpreadsheetKey || lastLoadedSheet.id;
    lastLoadedSheet.googleSpreadsheetWorksheet =
      lastLoadedSheet.googleSpreadsheetWorksheet || lastLoadedSheet.worksheet;

    if (options && (options.googleSpreadsheetKey || '').indexOf('http') === 0) {
      // Parse out the spreadsheet ID
      // Located between /d/ and the next slash after that
      key = options.googleSpreadsheetKey;
      key = key.substr(key.indexOf('/d/') + 3);
      key = key.substr(0, key.indexOf('/'));

      options.googleSpreadsheetKey = key;
    }

    ws.merge(customizedOptions, {
      data: lastLoadedSheet
    });



    updateAggregated();
    init(aggregatedOptions);
    loadSeries();
    emitChange();
    // The sheet will be loaded async, so we should listen to the load event.
    gc(function(chart) {
      var found = Highcharts.addEvent(chart, 'load', function() {
        loadSeriesFromDataSource();
        //loadSeries();
        found();
      });
    });
  }

  function getCleanOptions(source) {
    return source;

    // return ws.merge(ws.merge({}, source), {
    //   data: {
    //     csv: false
    //   }
    // });

    // var clone = ws.merge({}, source || customizedOptions);

    // if (!ws.isArr(clone.yAxis)) {
    //   clone.yAxis = [clone.yAxis];
    // }

    // (clone.yAxis || []).forEach(function (axis) {
    //   if (axis.series) {
    //     delete axis.series.data;
    //   }
    // });

    // return clone;
  }

  /** Export project as JSON
   *  @memberof ws.ChartPreview
   */
  function toProject() {
    var loadedCSVRaw = false,
      gsheet = lastLoadedSheet,
      livedata = lastLoadedLiveData,
      themeData = false,
      seriesMapping = false;
    if (
      (chart &&
      chart.options &&
      chart.options.data &&
      chart.options.data.csv) || 
      dataTableCSV !== null
    ) {
      loadedCSVRaw = dataTableCSV || (chart.options.data ? chart.options.data.csv : '');

      if (chart.options.data && chart.options.data.seriesMapping) {
        seriesMapping = chart.options.data.seriesMapping;
      }
    }

    if (
      chart &&
      chart.options &&
      chart.options.data &&
      chart.options.data.googleSpreadsheetKey
    ) {
      gsheet = {
        googleSpreadsheetKey: chart.options.data.googleSpreadsheetKey,
        googleSpreadsheetWorksheet:
          chart.options.data.googleSpreadsheetWorksheet
      };
      assignDataFields = false;
    }

    if (chart &&
        chart.options &&
        chart.options.data &&
        chart.options.data.url
      ) {
        livedata = {
          url: chart.options.data.url,
          interval: chart.options.data.interval,
          type: chart.options.data.type
        };
        assignDataFields = false;
    }

    if (themeMeta && themeMeta.id && themeOptions) {
      themeData = {
        id: themeMeta.id,
        name: themeMeta.name,
        options: themeOptions || {},
        customCode: themeCustomCode || ''
      };
    }
    
    if (chart && chart.options && chart.options.annotations) {
      chartPlugins.annotations = 1;
    }

    return {
      template: templateOptions,
      options: getCleanOptions(customizedOptions),
      customCode: ws.isFn(customCode) ? customCodeStr : '',
      theme: themeData,
      settings: {
        constructor: constr,
        template: templateSettings,
        plugins: chartPlugins,//getPlugins(),
        dataProvider: {
          csv: !gsheet && !livedata ? loadedCSVRaw || lastLoadedCSV : false,
          googleSpreadsheet: gsheet,
          liveData: livedata,
          assignDataFields: assignDataFields,
          seriesMapping: seriesMapping
        }
      }
      //editorOptions: ws.serializeEditorOptions()
    };
  }

  function getTemplateSettings() {
    return templateSettings;
  }

  function clearData(skipReinit) {
    lastLoadedCSV = false;
    lastLoadedSheet = false;
    lastLoadedLiveData = false;

    if (customizedOptions && customizedOptions.data) {
      customizedOptions.data = {};
    }

    if (customizedOptions.series) {
      customizedOptions.series = ws.isArr(customizedOptions.series)
        ? customizedOptions.series
        : [customizedOptions.series];

      
      customizedOptions.series.forEach(function(series) {
        if (series.data) {
          delete series.data;
        }
      });
    }

    if (!skipReinit) {
      updateAggregated();
      init(aggregatedOptions);
      emitChange();
    }
  }

  /**
   * Export project as a JSON string
   */
  function toProjectStr(tabs) {
    return stringifyFn(toProject(), tabs);
  }

  /** Load JSON data
   * Functionally, this only instances a new
   * chart with the supplied data as its options.
   * It accepts both a string and and object
   *
   * @memberof ws.ChartPreview
   * @name data.json
   * @param data {object} - the data to load
   */
  function loadJSONData(data) {
    lastLoadedCSV = false;

    gc(function(chart) {
      if (ws.isStr(data)) {
        try {
          loadJSONData(JSON.parse(data));
        } catch (e) {
          ws.snackBar('invalid json: ' + e);
        }
      } else if (ws.isBasic(data)) {
        ws.snackBar('the data is not valid json');
      } else {
        templateOptions = [{}];
        ws.clearObj(customizedOptions);
        ws.merge(customizedOptions, ws.merge({}, data));

        if (!ws.isNull(data.series)) {
          customizedOptions.series = data.series;
        }

        updateAggregated();
        init(customizedOptions);
        loadSeries();
        emitChange();
      }
    });
  }

  /**
   * Set Data table CSV as user could have unused columns that need saving too.
   */

  function setDataTableCSV(csv) {
    dataTableCSV = csv;
  }

  /**
   * Set Assign Data fields from datatable
   */

  function setAssignDataFields(fields) {
    assignDataFields = fields;
  }


  /**
   * Add/Remove a module from the charts config
   */

  function togglePlugins(groupId, newValue) {
    if (newValue) {
      chartPlugins[groupId] = 1;
    } else {
      delete chartPlugins[groupId];
    }
  }


  function getPlugins() {
    var arr = [];

    Object.keys(chartPlugins).filter(function(key) {
      chartPlugins[key].forEach(function(object) {
        if (arr.indexOf(object) === -1) arr.push(object);
      });
    });

    return arr;
  }

  /**
   * Load raw dataset (array of arrays)
   */
  //function

  /** Set chart options from an object
   *
   */
  function setChartOptions(options) {
    function emitWidthChange() {
      events.emit('AttrChange', {
        id: 'chart.width'
      });
    }

    function emitHeightChange() {
      events.emit('AttrChange', {
        id: 'chart.height'
      });
    }

    var doEmitHeightChange = false,
      doEmitWidthChange = false;

    // Temp. hack to deal with actual sizing
    if (options && options.chart) {
      if (typeof options.chart.width !== 'undefined') {
        if (
          !customizedOptions.chart ||
          typeof customizedOptions.chart === 'undefined'
        ) {
          doEmitWidthChange = true;
        } else if (customizedOptions.chart.width !== options.chart.width) {
          doEmitWidthChange = true;
        }
      }

      if (typeof options.chart.height !== 'undefined') {
        if (
          !customizedOptions.chart ||
          typeof customizedOptions.chart === 'undefined'
        ) {
          doEmitHeightChange = true;
        } else if (customizedOptions.chart.height !== options.chart.height) {
          doEmitHeightChange = true;
        }
      }
    }

    // console.time('remblanks');
    customizedOptions = ws.transform.remBlanks(
      ws.merge({}, options, false)
    );
    // console.timeEnd('remblanks');

    if (customizedOptions && customizedOptions.lang) {
      Highcharts.setOptions({
        lang: customizedOptions.lang
      });
    }

    if (options && options.global) {
    }

    // This is nasty
    if (options && options.data && options.data.googleSpreadsheetKey) {
      events.emit('LoadedGoogleSpreadsheet');
    }

    updateAggregated();
    init(aggregatedOptions, false, true);
    emitChange();

    if (doEmitHeightChange) {
      emitHeightChange();
    }

    if (doEmitWidthChange) {
      emitWidthChange();
    }
  }

  /** Load chart settings
   * Note that merges the incoming settings with the existing ones.
   * @memberof ws.ChartPreview
   * @name data.settings
   * @param settings {object} - the settings to load
   */
  function loadChartSettings(settings) {
    gc(function(chart) {
      Object.keys(settings || {}).forEach(function(key) {
        ws.setAttr(customizedOptions, key, settings[key]);
      });

      updateAggregated();
      init(aggregatedOptions);
      emitChange();
    });
  }

  function loadSeriesData(seriesArr) {
    if (!ws.isArr(seriesArr)) return;
    customizedOptions.series = customizedOptions.series || [];

    if (seriesArr.length < customizedOptions.series.length) {
      //Need to delete some series
      customizedOptions.series.splice(
        seriesArr.length,
        customizedOptions.series.length - seriesArr.length
      );
    }

    seriesArr.forEach(function(s, i) {
      if (s.name) {
        set('series-name', s.name, i);
      }
      if (s.data) {
        set('series-data', s.data, i);
      }
    });
  }

  /** 设置一个属性
   *  @memberof ws.ChartPreview
   *  @name options.set
   *  @param id {string} - the path of the attribute
   *  @param value {anything} - the value to set
   *  @param index {number} - used if the option is an array
   */
  function set(id, value, index) {
    gc(function(chart) {
      //ws.setAttr(chart.options, id, value, index);
      ws.setAttr(
        chart.options,
        'plotOptions--series--animation',
        false,
        index
      );
    });

    //We want to be able to set the customized options even if the chart
    //doesn't exist
    ws.setAttr(customizedOptions, id, value, index);

    flatOptions[id] = value;

    if (id.indexOf('lang--') === 0 && customizedOptions.lang) {
      Highcharts.setOptions({
        lang: customizedOptions.lang
      });
    }

    updateAggregated();
    init(aggregatedOptions, false, true);
    emitChange();

    events.emit('AttrChange', {
      id: id.replace(/\-\-/g, '.').replace(/\-/g, '.'),
      value: value
    });
  }

  /** Get embeddable JSON
   *  This returns the merged chart, with both customized options
   *  and options set indirectly through templates.
   *  @memberof ws.ChartPreview
   *  @name export.json
   *  @returns {object} - the chart object
   */
  function getEmbeddableJSON(noCustomCode) {
    var r;
    updateAggregated(noCustomCode);
    r = getCleanOptions(ws.merge({}, aggregatedOptions));

    //This should be part of the series
    if (!ws.isNull(r.data)) {
      // Don't delete spreadsheet stuff
      if (!r.data.googleSpreadsheetKey) {
        r.data = undefined;
      }
      //delete r['data'];
    }

    if (r && ws.isArr(r.series)) {
      r.series = r.series.map(function(s) {
        var cloned = ws.merge({}, s);
        delete s.data;
        return s;
      });
    }

    if (lastLoadedSheet) {
      ws.merge(r, {
        data: lastLoadedSheet
      });
    } else if (lastLoadedLiveData) {
      ws.merge(r, {
        data: lastLoadedLiveData,
        googleSpreadsheetKey: false,
        googleSpreadsheetWorksheet: false
      });
    } else if (lastLoadedCSV) {
      ws.merge(r, {
        data: {
          csv: lastLoadedCSV,
          googleSpreadsheetKey: false,
          googleSpreadsheetWorksheet: false
        }
      });
    }

    return r;
  }

  /**
   * Convert the chart to a string
   */
  function toString(tabs) {
    return stringifyFn(getEmbeddableJSON(), tabs);
  }

  /** Get embeddable SVG
   *  @memberof ws.ChartPreview
   *  @name export.svg
   *  @returns {string} - the result from `Highcharts.Chart.getSVG()`
   */
  function getEmbeddableSVG() {
    return gc(function(chart) {
      return ws.isFn(chart.getSVG) ? chart.getSVG() : '';
    });
  }

  /** Get embeddable JavaScript
   *  @memberof ws.ChartPreview
   *  @name export.js
   *  @param id {string} - the ID of the node to attach the chart to
   *  @returns {string} - a string containing JavaScript to reproduce the chart
   */
  function getEmbeddableJavaScript(id) {
    return gc(function(chart) {
      var cdnIncludes = [
          'https://code.highcharts.com/stock/highstock.js',
          'https://code.highcharts.com/highcharts-more.js',
          'https://code.highcharts.com/highcharts-3d.js',
          'https://code.highcharts.com/modules/data.js',
          'https://code.highcharts.com/modules/exporting.js',
          'https://code.highcharts.com/modules/funnel.js',
          'https://code.highcharts.com/6.0.2/modules/annotations.js',
          'https://code.highcharts.com/modules/accessibility.js',
          // 'https://code.highcharts.com/modules/series-label.js'
          'https://code.highcharts.com/modules/solid-gauge.js'
        ],
        cdnIncludesArr = [],
        title =
          chart.options && chart.options.title
            ? chart.options.title.text || 'untitled chart'
            : 'untitled chart';

      id = id || '';

      /*
                This magic code will generate an injection script that will
                check if highcharts is included, and include it if not.
                Afterwards, it will create the chart, and insert it into the page.

                It's quite messy, could to client-side templating or something,
                but it works.
            */

      if (ws.option('includeCDNInExport')) {
        cdnIncludesArr = [
          'var files = ',
          JSON.stringify(cdnIncludes),
          ',',
          'loaded = 0; ',
          'if (typeof window["HighchartsEditor"] === "undefined") {',
          'window.HighchartsEditor = {',
          'ondone: [cl],',
          'hasWrapped: false,',
          'hasLoaded: false',
          '};',
          'include(files[0]);',
          '} else {',
          'if (window.HighchartsEditor.hasLoaded) {',
          'cl();',
          '} else {',
          'window.HighchartsEditor.ondone.push(cl);',
          '}',
          '}',
          'function isScriptAlreadyIncluded(src){',
          'var scripts = document.getElementsByTagName("script");',
          'for (var i = 0; i < scripts.length; i++) {',
          'if (scripts[i].hasAttribute("src")) {',
          'if ((scripts[i].getAttribute("src") || "").indexOf(src) >= 0 || (scripts[i].getAttribute("src") === "http://code.highcharts.com/highcharts.js" && src === "https://code.highcharts.com/stock/highstock.js")) {',
          'return true;',
          '}',
          '}',
          '}',
          'return false;',
          '}',
          'function check() {',
          'if (loaded === files.length) {',
          'for (var i = 0; i < window.HighchartsEditor.ondone.length; i++) {',
          'try {',
          'window.HighchartsEditor.ondone[i]();',
          '} catch(e) {',
          'console.error(e);',
          '}',
          '}',
          'window.HighchartsEditor.hasLoaded = true;',
          '}',
          '}',

          'function include(script) {',
          'function next() {',
          '++loaded;',
          'if (loaded < files.length) {',
          'include(files[loaded]);',
          '}',
          'check();',
          '}',
          'if (isScriptAlreadyIncluded(script)) {',
          'return next();',
          '}',
          'var sc=document.createElement("script");',
          'sc.src = script;',
          'sc.type="text/javascript";',
          'sc.onload=function() { next(); };',
          'document.head.appendChild(sc);',
          '}',

          'function each(a, fn){',
          'if (typeof a.forEach !== "undefined"){a.forEach(fn);}',
          'else{',
          'for (var i = 0; i < a.length; i++){',
          'if (fn) {fn(a[i]);}',
          '}',
          '}',
          '}',

          'var inc = {},incl=[]; each(document.querySelectorAll("script"), function(t) {inc[t.src.substr(0, t.src.indexOf("?"))] = 1; ',
          '});'
        ];
      }

      const chartConstr = (constr.some(function(a) {
        return a === 'StockChart';
      }) ? 'StockChart' : 'Chart');

      return (
        '\n' +
        [
          '(function(){ ',

          cdnIncludesArr.join(''),

          ' function cl() {',
          'if(typeof window["Highcharts"] !== "undefined"){', //' && Highcharts.Data ? ',

          !customizedOptions.lang
            ? ''
            : 'Highcharts.setOptions({lang:' +
              JSON.stringify(customizedOptions.lang) +
              '});',
          'var options=',
          stringifyFn(getEmbeddableJSON(true)),
          ';',
          ws.isFn(customCode) ? customCodeStr : '',
          'new Highcharts.' + chartConstr + '("',
          id,
          '", options);',
          '}',
          '}',
          '})();'
        ].join('') +
        '\n'
      );
    });
  }

  function getCodePreview() {
    var options = getEmbeddableJSON(true);

    if (ws.isFn(customCode) && customCodeStr) {
      customCode(options);
    }

    return stringifyFn(options, '  ');
  }

  /** Get embeddable HTML
   *  @memberof ws.ChartPreview
   *  @name export.html
   *  @param placehold {bool} - if true, SVG will also be embedded
   *  @returns {string} - a string of embeddable HTML
   */
  function getEmbeddableHTML(placehold) {
    return gc(function(chart) {
      var id = 'highcharts-' + ws.uuid();
      return (
        '\n' +
        [
          '<div id="',
          id,
          '">',
          placehold ? getEmbeddableSVG() : '',
          '</div>'
        ].join('') +
        '<script>' +
        getEmbeddableJavaScript(id) +
        '</script>'
      );
    });
  }

  /**
   * Expand the chart from its drawer
   * @memberof ws.ChartPreview
   */
  function expand() {
    gc(function(chart) {
      if (!expanded) {
        ws.dom.style(properties.expandTo, {
          width: '100%',
          display: 'block'
        });

        preExpandSize = ws.dom.size(parent);
        init(chart.options, properties.expandTo);
        expanded = true;

        toggleButton.className =
          'ws-icon ws-chart-preview-expand fa fa-times-circle';
      }
    });
  }

  /** Collapse the chart into its drawer
   *  @memberof ws.ChartPreview
   */
  function collapse() {
    gc(function(chart) {
      if (preExpandSize && expanded) {
        ws.dom.style(properties.expandTo, {
          width: '0px',
          display: 'none'
        });

        toggleButton.className =
          'ws-icon ws-chart-preview-expand fa fa-external-link-square';

        init(chart.options, parent);
        expanded = false;
      }
    });
  }

  /** Flush all options and start over
   *  @memberof ws.ChartPreview
   *  @name new
   */
  function newChart() {
    ws.cloud.flush();

    templateOptions = [];
    ws.clearObj(customizedOptions);
    ws.clearObj(flatOptions);

    customCode = false;

    // ws.merge(customizedOptions, properties.defaultChartOptions);

    updateAggregated();

    init(aggregatedOptions);

    emitChange();
    events.emit('New');
  }

  /** Export the chart - calls `Highcharts.Chart.exportChart(..)`
   *  @memberof ws.ChartPreview
   *  @name data.export
   *  @param optons {object} - the export options
   */
  function exportChart(options) {
    gc(function(chart) {
      chart.exportChart(options, aggregatedOptions);
    });
  }

  /** Attach to a new DOM parent
   *  @memberof ws.ChartPreview
   *  @param newParent {DOMNode} - the node to attach to
   */
  function changeParent(newParent) {
    parent = newParent;
    init();
  }

  /** Returns the constructor currently in use
   *  @memberof ws.ChartPreview
   *  @returns {string}
   */
  function getConstructor() {
    return (constr.some(function(a) {
      return a === 'StockChart';
    }) ? 'StockChart' : 'Chart');
  }

  function getTheme() {
    return {
      id: themeMeta.id,
      name: themeMeta.name,
      options: themeOptions
    };
  }

  function getCustomCode() {
    return customCodeStr && customCodeStr.length
      ? customCodeStr
      : customCodeDefault;

    // return ws.isFn(customCode) ?
    // customCodeStr || customCodeDefault :
    // customCode || customCodeDefault;
  }

  function setCustomCode(newCode, errFn, skipEmit) {
    var fn;
    
    if (!newCode) {
      customCode = false;
      customCodeStr = '';
    }

    try {
      // eval('(var options = {};' + newCode + ')');
      customCode = new Function(
        'options',
        [
          'if (options.yAxis && options.yAxis.length === 1) options.yAxis = options.yAxis[0];',
          'if (options.xAxis && options.xAxis.length === 1) options.xAxis = options.xAxis[0];',
          'if (options.zAxis && options.zAxis.length === 1) options.zAxis = options.zAxis[0];',
          'if (!options.series || options.series.length === 0) return;',
          'var encodedUrl = "";',
           themeCustomCode
        ].join('') + newCode 
      );
      customCodeStr = newCode;
    } catch (e) {
      customCode = false;
      customCodeStr = newCode;
      return ws.isFn(errFn) && errFn(e);
    }

    if (!skipEmit) {
      updateAggregated();
      
      if (!customizedOptions.data || (customizedOptions 
         && customizedOptions.data 
         && !customizedOptions.data.googleSpreadsheetKey)) {
        init(aggregatedOptions);
      }

      emitChange();
    }
  }

  function setIsAnnotating(isAnnotate) {
    isAnnotating = isAnnotate
  }

  function setAnnotationType(type) {
    annotationType = type;
  }

  function addLabel(x, y, text, color, type) {
    if (chart) {

      if (!customizedOptions.annotations) customizedOptions.annotations = [];
      var annotation = chart.addAnnotation({
        id: "label_" + customizedOptions.annotations.length,
        labels: [{
            id: "label_" + customizedOptions.annotations.length,
            text: text,
            point: { 
              x: x, 
              y: y,            
              xAxis: 0,
              yAxis: 0 
            },
            backgroundColor: color,
            shape: type,
            borderWidth: type !== 'connector' ? 0 : 1,
            x: 0,
            y: type === 'circle' ? 0 : -16
        }]
      });

      customizedOptions.annotations.push({
        id: "label_" + customizedOptions.annotations.length,
        labels: [annotation.options.labels[0]]
      });
    }
  }


  function addAnnotationLabel(x, y, text, color, type) {
    addLabel(x, y, text, color, type);
  }
  ///////////////////////////////////////////////////////////////////////////

  //Init the initial chart
  updateAggregated();
  init();

  ws.dom.on(toggleButton, 'click', function() {
    return expanded ? collapse() : expand();
  });

  function addBlankSeries(index, type) {
    if (!customizedOptions.series[index]) {
      customizedOptions.series[index] = {
        data:[],
        turboThreshold: 0,
        _colorIndex: index,
        _symbolIndex: 0,
        compare: undefined
      };
    }

    if(type) customizedOptions.series[index].type = type;
    
    //Init the initial chart
    updateAggregated();
    init();
  }
  
  function addAnnotation(e) {
    var xValue = chart.xAxis[0].toValue(e.chartX),
        yValue = chart.yAxis[0].toValue(e.chartY);

    
    if (!chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) return;

    if (!customizedOptions.annotations) customizedOptions.annotations = []; //[{}];

    if (annotationType === 'label') {
      events.emit('ShowTextDialog', chart, xValue, yValue);
    } else if (annotationType === 'delete'){
    } else {
      addShape(chart, annotationType, xValue, yValue/*e.chartX - this.plotLeft, e.chartY - this.plotTop*/);
    }
  }
  ///////////////////////////////////////////////////////////////////////////

  exports = {
    assignTheme: assignTheme,
    clearTheme: clearTheme,
    getTheme: getTheme,
    getConstructor: getConstructor,
    on: events.on,
    expand: expand,
    collapse: collapse,
    new: newChart,
    changeParent: changeParent,

    getHighchartsInstance: gc,

    loadTemplate: loadTemplate,
    loadTemplateForSerie: loadTemplateForSerie,
    loadSeries: loadSeriesData,
    resize: resize,

    setCustomCode: setCustomCode,
    getCustomCode: getCustomCode,

    toProject: toProject,
    toProjectStr: toProjectStr,
    loadProject: loadProject,

    toString: toString,
    setIsAnnotating: setIsAnnotating,
    setAnnotationType: setAnnotationType,
    addAnnotationLabel: addAnnotationLabel,
    addAnnotation: addAnnotation,

    options: {
      set: set,
      setAll: setChartOptions,
      customized: customizedOptions,
      getCustomized: function() {
        return customizedOptions;
      },
      full: aggregatedOptions,
      flat: flatOptions,
      chart: chartOptions,
      getPreview: getCodePreview,
      all: function(){
        return chart;
      },
      addBlankSeries: addBlankSeries,
      togglePlugins: togglePlugins,
      getTemplateSettings: getTemplateSettings
    },

    data: {
      csv: loadCSVData,
      json: loadJSONData,
      settings: loadChartSettings,
      export: exportChart,
      gsheet: loadGSpreadsheet,
      clear: clearData,
      live: loadLiveData,
      setDataTableCSV: setDataTableCSV,
      setAssignDataFields: setAssignDataFields,
      deleteSerie: deleteSerie,
      deleteSeries: deleteSeries
    },

    export: {
      html: getEmbeddableHTML,
      json: getEmbeddableJSON,
      svg: getEmbeddableSVG,
      js: getEmbeddableJavaScript
    }
  };

  return exports;
};
