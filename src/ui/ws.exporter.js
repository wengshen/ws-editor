

// @format

(function() {
  var exportPlugins = {};

  ws.plugins.export = {
    /** Install an export plugin
     *  @namespace ws.plugins.export
     *  @param name {string} - the name of the plugin
     *  @param definition {object} - the plugin definition
     */
    install: function(name, definition) {
      if (ws.isNull(exportPlugins[name])) {
        exportPlugins[name] = ws.merge(
          {
            description: '',
            options: {},
            title: false,
            downloadOutput: false
          },
          definition
        );

        if (exportPlugins[name].dependencies) {
          ws.include(exportPlugins[name].dependencies);
        }
      } else {
        ws.log(
          1,
          'tried to register an export plugin which already exists:',
          name
        );
      }
    }
  };

  /** Export widget
   *
   *  @example
   *  var exporter = ws.Exporter(document.body),
   *      preview = ws.ChartPreview(document.body)
   *  ;
   *
   *  exporter.init(preview.export.json(), preview.export.html(), preview.export.svg(), preview);
   *
   *  @constructor
   *
   *  @param parent {domnode} - the node to attach the widget to
   *  @param attributes {object} - the options
   *    > options {string} - things to include: `csv html json plugins`
   *    > plugins {string|array} - plugins to activate
   */
  ws.Exporter = function(parent, attributes) {
    var //splitter = ws.HSplitter(parent, {leftWidth: 50, noOverflow: true}),
      properties = ws.merge(
        {
          options: 'svg html json plugins',
          plugins: 'beautify-js beautify-json'
        },
        attributes
      ),
      tctrl = ws.TabControl(parent, false, true),
      htmlTab = tctrl.createTab({ title: 'HTML' }),
      jsonTab = tctrl.createTab({ title: 'JSON' }),
      svgTab = tctrl.createTab({ title: 'SVG' }),
      pluginTab = tctrl.createTab({ title: 'Plugins' }),
      pluginSplitter = ws.HSplitter(pluginTab.body, { leftWidth: 30 }),
      pluginList = ws.List(pluginSplitter.left),
      exportJSON = ws.dom.cr('a', 'ws-imp-button ws-imp-pasted-button', 'Download'), //ws.dom.cr('a', '', 'Download'),
      exportHTML = ws.dom.cr('a', 'ws-imp-button ws-imp-pasted-button', 'Download'),
      exportSVG = ws.dom.cr('a', 'ws-imp-button ws-imp-pasted-button', 'Download'),
      jsonValue = ws.dom.cr(
        'textarea',
        'ws-imp-pastearea ws-scrollbar'
      ),
      htmlValue = ws.dom.cr(
        'textarea',
        'ws-imp-pastearea ws-scrollbar'
      ),
      svgValue = ws.dom.cr(
        'textarea',
        'ws-imp-pastearea ws-scrollbar'
      ),
      currentChartPreview = false,
      hasBuiltPlugins = false,
      hasBeenVisible = false,
      pluginData = {},
      activePlugins = {},
      activePlugin = false;

    properties.options = ws.arrToObj(properties.options);
    properties.plugins = ws.arrToObj(properties.plugins);

    ///////////////////////////////////////////////////////////////////////////

    //Hides unwanted stuff
    function updateOptions() {
      if (!properties.options.html) {
        htmlTab.hide();
      }
      if (!properties.options.json) {
        jsonTab.hide();
      }
      if (!properties.options.svg) {
        svgTab.hide();
      }
      if (!properties.options.plugins) {
        pluginTab.hide();
      }
      if (Object.keys(properties.plugins) === 0) {
        pluginTab.hide();
      }

      tctrl.selectFirst();
    }

    //Build plugin panel
    function buildPlugins() {
      if (hasBuiltPlugins) return;
      hasBuiltPlugins = true;

      Object.keys(exportPlugins).forEach(function(name) {
        var options = exportPlugins[name];

        pluginData[name] = { options: {} };

        if (!properties.plugins[name]) {
          return false;
        }

        function buildBody() {
          var container = ws.dom.cr('div', 'ws-plugin-details'),
            executeBtn = ws.dom.cr(
              'button',
              'ws-imp-button',
              options.exportTitle || 'Export'
            ),
            dynamicOptionsContainer = ws.dom.cr(
              'table',
              'ws-customizer-table'
            ),
            additionalUI = ws.dom.cr('div'),
            dynamicOptions = pluginData[name].options;

          // pluginSplitter.right.innerHTML = '';

          Object.keys(options.options || {}).forEach(function(pname) {
            dynamicOptions[pname] = options.options[pname].default;

            ws.dom.ap(
              dynamicOptionsContainer,
              ws.InspectorField(
                options.options[pname].type,
                options.options[pname].default,
                {
                  title: options.options[pname].label
                },
                function(nval) {
                  dynamicOptions[pname] = nval;

                  if (ws.isFn(options.show)) {
                    options.show.apply(pluginData[name], [currentChartPreview]);
                  }
                },
                true
              )
            );
          });

          function doExport() {
            if (ws.isFn(options.export) && currentChartPreview) {
              options.export.apply(pluginData[name], [
                dynamicOptions,
                currentChartPreview,
                function(err, data, filename) {
                  if (err) return ws.snackBar('Export error: ' + err);

                  if (options.downloadOutput) {
                    ws.download(filename, data);
                  }

                  ws.snackBar((options.title || name) + ' export complete');
                },
                additionalUI
              ]);
            }
          }

          ws.dom.on(executeBtn, 'click', doExport);

          ws.dom.ap(pluginSplitter.right, container);

          ws.dom.style(container, { display: 'none' });

          ws.dom.ap(
            container,
            ws.dom.cr(
              'div',
              'ws-customizer-table-heading',
              options.title || name
            ),
            ws.dom.cr('div', 'ws-imp-help', options.description),
            Object.keys(options.options || {}).length
              ? dynamicOptionsContainer
              : false,
            additionalUI,
            options.export ? executeBtn : false
          );

          if (ws.isFn(options.create)) {
            options.create.apply(pluginData[name], [
              currentChartPreview,
              additionalUI
            ]);
          }

          activePlugins[name] = {
            export: doExport,
            show: function() {
              if (activePlugin) {
                activePlugin.hide();
              }
              ws.dom.style(container, { display: '' });
              options.show.apply(pluginData[name], [currentChartPreview]);
              activePlugin = activePlugins[name];
            },
            hide: function() {
              ws.dom.style(container, { display: 'none' });
            }
          };
        }

        buildBody();

        pluginList.addItem({
          id: name,
          title: options.title || name,
          click: activePlugins[name].show
        });
      });
    }

    /** Set the export boxes based on chart JSON data (chart.options)
     *  @memberof ws.Exporter
     *  @param chartData {object} - the chart JSON
     *  @param chartHTML {string} - chart HTML
     *  @param chartSVG {string} - chart svg
     *  @param chartPreview {object} - instance of ws.ChartPreview
     */
    function init(chartData, chartHTML, chartSVG, chartPreview) {
      var title = '_export';

      if (chartData.title && chartData.title.text) {
        title = chartData.title.text.replace(/\s/g, '_') + title;
      } else {
        title = 'untitled' + title;
      }

      jsonValue.value = JSON.stringify(chartData);
      exportJSON.href = 'data:application/octet-stream,' + encodeURIComponent(jsonValue.value);

      htmlValue.value = chartHTML;
      exportHTML.href =
        'data:application/octet-stream,' + encodeURIComponent(chartHTML);

      svgValue.value = chartSVG;
      exportSVG.href =
        'data:application/octet-stream,' + encodeURIComponent(chartSVG);

      exportJSON.download = title + '.json';
      exportHTML.download = title + '.html';
      exportSVG.download = title + '.svg';

      ws.dom.on(exportJSON, 'click', function() {
        ws.events('UIAction', 'BtnDownloadJSON');
      });

      ws.dom.on(exportHTML, 'click', function() {
        ws.events('UIAction', 'BtnDownloadHTML');
      });

      ws.dom.on(exportSVG, 'click', function() {
        ws.events('UIAction', 'BtnDownloadSVG');
      });

      currentChartPreview = chartPreview;

      buildPlugins();

      // Object.keys(activePlugins).forEach(function (name) {
      //     activePlugins[name].show();
      // });

      if (activePlugin) {
        activePlugin.show();
      }

      hasBeenVisible = true;
    }

    /** Force a resize of the UI
     *  @memberof ws.Exporter
     *  @param w {number} - the new width
     *  @param h {number} - the new height
     */
    function resize(w, h) {
      var bsize;

      //splitter.resize(w, h);
      tctrl.resize(w, h);
      bsize = tctrl.barSize();

      pluginSplitter.resize(w, h - bsize.h - 20);
      pluginList.resize(w, h - bsize.h);
    }

    function doSelectOnClick(thing, id) {
      ws.dom.on(thing, 'click', function() {
        thing.focus();
        thing.select();
        ws.emit('UIAction', 'Copy' + id);
      });
    }

    ///////////////////////////////////////////////////////////////////////////

    ws.dom.ap(
      htmlTab.body,
      // ws.dom.cr('div', 'ws-imp-headline', 'Export HTML'),
      ws.dom.ap(ws.dom.cr('div', 'ws-imp-spacer'), htmlValue),
      exportHTML
    );

    ws.dom.ap(
      jsonTab.body,
      // ws.dom.cr('div', 'ws-imp-headline', 'Export JSON'),
      ws.dom.ap(ws.dom.cr('div', 'ws-imp-spacer'), jsonValue),
      exportJSON
    );

    ws.dom.ap(
      svgTab.body,
      // ws.dom.cr('div', 'ws-imp-headline', 'Export JSON'),
      ws.dom.ap(ws.dom.cr('div', 'ws-imp-spacer'), svgValue),
      exportSVG
    );

    resize();
    updateOptions();

    doSelectOnClick(jsonValue, 'JSON');
    doSelectOnClick(htmlValue, 'HTML');
    doSelectOnClick(svgValue, 'SVG');

    ///////////////////////////////////////////////////////////////////////////

    return {
      init: init,
      resize: resize,
      buildPluginUI: buildPlugins
    };
  };
})();
