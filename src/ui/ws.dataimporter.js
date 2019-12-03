

// @format

(function() {
  var webImports = {};

  ws.plugins.import = {
    /** Install a data import plugin
     * @namespace ws.plugins.import
     * @param name {string} - the name of the plugin
     * @param defintion {object} - the plugin definition
     *   > description {string} - the plugin description
     *   > treatAs {string} - what to treat the import as: `json|csv`
     *   > fetchAs {string} - what the expect request return is
     *   > defaultURL {string} - the default URL
     *   > depdendencies {array<string>} - set of additional javascript/css to include
     *   > options {object} - additional user-supplied options
     *      > label {string} - the title of the option
     *      > type {string} - the type of the option
     *      > default {string} - the default value
     *   > filter {function} - function to call when executing the plugin
     *      >  url {anything} - request url
     *      >  options {object} - contains user-defined options
     *      >  callback {function} - function to call when the import is done
     */
    install: function(name, defintion) {
      if (ws.isNull(webImports[name])) {
        webImports[name] = ws.merge(
          {
            title: false,
            description: '',
            treatAs: 'csv',
            fetchAs: 'json',
            defaultURL: '',
            dependencies: [],
            options: {},
            filter: function() {}
          },
          defintion
        );

        if (webImports[name].dependencies) {
          webImports[name].dependencies.forEach(function(d) {
            ws.include(d);
          });
        }
      } else {
        ws.log(
          1,
          'tried to register an import plugin which already exists:',
          name
        );
      }
    }
  };

  /** Data importer widget
   *
   *  @example
   *  var dimp = ws.DataImporter(document.body);
   *  dimp.on('ImportCSV', function (data) {
   *      console.log('Importing csv:', data.csv);
   *  });
   *
   *  @constructor
   *
   *  @emits ImportChartSettings - when importing chart settings
   *  @emits ImportCSV - when importing CSV
   *  @emits ImportJSON - when importing JSON
   *  @param parent {domnode} - the node to attach the widget to
   *  @param attributes {object} - the settings
   *     > options {string} - the options to include: `csv json plugins samples`
   *     > plugins {string} - the plugins to activate (must have been installed first)
   */
  ws.DataImporter = function(parent, attributes) {
    var events = ws.events(),
      properties = ws.merge(
        {
          options: ['csv', 'plugins', 'samples', 'export'],
          plugins: ['CSV', 'JSON', 'Difi', 'Socrata', 'Google Spreadsheets']
        },
        attributes
      ),
      tabs = ws.TabControl(parent, false, true),
      csvTab = tabs.createTab({ title: 'Import' }),
      exportTab = tabs.createTab({ title: 'Export' }),
      jsonTab = tabs.createTab({ title: 'JSON' }),
      webTab = tabs.createTab({ title: 'Plugins' }),
      samplesTab = tabs.createTab({ title: 'Sample Data' }),
      csvPasteArea = ws.dom.cr('textarea', 'ws-imp-pastearea'),
      csvImportBtn = ws.dom.cr(
        'button',
        'ws-imp-button ws-imp-pasted-button',
        'Import Pasted Data'
      ),
      liveDataImportBtn = ws.dom.cr('button', 'ws-imp-button', 'Live Data'),
      csvImportFileBtn = ws.dom.cr(
        'button',
        'ws-imp-button',
        'Import File'
      ),
      delimiter = ws.dom.cr('input', 'ws-imp-input'),
      dateFormat = ws.dom.cr('input', 'ws-imp-input'),
      decimalPoint = ws.dom.cr('input', 'ws-imp-input'),
      firstAsNames = ws.dom.cr('input', 'ws-imp-input'),
      jsonPasteArea = ws.dom.cr('textarea', 'ws-imp-pastearea'),
      jsonImportBtn = ws.dom.cr('button', 'ws-imp-button', 'Import'),
      jsonImportFileBtn = ws.dom.cr(
        'button',
        'ws-imp-button',
        'Upload & Import File'
      ),      
      spreadsheetImportBtn = ws.dom.cr(
        'button',
        'ws-imp-button',
        'Google Spreadsheet'
      ),
      commaDelimitedBtn = ws.dom.cr(
        'button',
        'ws-imp-button ws-export-btn',
        'Export comma delimited'
      ),
      semicolonDelimitedBtn = ws.dom.cr(
        'button',
        'ws-imp-button ws-export-btn',
        'Export semi-colon delimited'
      ),
      webSplitter = ws.HSplitter(webTab.body, { leftWidth: 30 }),
      webList = ws.List(webSplitter.left);

    jsonPasteArea.value = JSON.stringify({}, undefined, 2);

    setDefaultTabSize(600, 600, [csvTab, exportTab, jsonTab, webTab, samplesTab]);
    ///////////////////////////////////////////////////////////////////////////

    ws.dom.style(samplesTab.body, { overflow: 'hidden' });

    properties.options = ws.arrToObj(properties.options);
    properties.plugins = ws.arrToObj(properties.plugins);

    //Remove referenced un-installed plugins.
    Object.keys(properties.plugins).forEach(function(plugin) {
      if (ws.isNull(webImports[plugin])) {
        delete properties.plugins[plugin];
      }
    });

    function setDefaultTabSize(w, h, tabs) {
      tabs.forEach(function (tab) {
        tab.on('Focus',function() {
          ws.dom.style(parent, { width: 600 + 'px', height: 600 + 'px' });
          tab.resize(600 - 10, 600 - 10);
        });
      });
    }

    function updateOptions() {
      if (!properties.options.csv) {
        csvTab.hide();
      }

      if (!properties.options.export) {
        exportTab.hide();
      }

      //Always disable json options..
      
      if (1 === 1 || !properties.options.json) {
        jsonTab.hide();
      }

      if (
        Object.keys(properties.plugins).length === 0 ||
        !properties.options.plugins
      ) {
        webTab.hide();
      }

      if (!properties.options.samples) {
        samplesTab.hide();
      }

      tabs.selectFirst();
    }

    function buildWebTab() {
      Object.keys(webImports).forEach(function(name) {
        if (!properties.plugins[name]) {
          return;
        }

        function buildBody() {
          var options = webImports[name],
            url = ws.dom.cr('input', 'ws-imp-input-stretch'),
            urlTitle = ws.dom.cr('div', '', 'URL'),
            importBtn = ws.dom.cr(
              'button',
              'ws-imp-button',
              'Import ' + name + ' from URL'
            ),
            dynamicOptionsContainer = ws.dom.cr(
              'table',
              'ws-customizer-table'
            ),
            dynamicOptions = {};

          url.value = options.defaultURL || '';

          Object.keys(options.options || {}).forEach(function(name) {
            dynamicOptions[name] = options.options[name].default;

            ws.dom.ap(
              dynamicOptionsContainer,
              ws.InspectorField(
                options.options[name].type,
                options.options[name].default,
                {
                  title: options.options[name].label
                },
                function(nval) {
                  dynamicOptions[name] = nval;
                },
                true
              )
            );
          });

          if (options.surpressURL) {
            ws.dom.style([url, urlTitle], {
              display: 'none'
            });
          }

          url.placeholder = 'Enter URL';

          ws.dom.on(importBtn, 'click', function() {
            ws.snackBar('Importing ' + name + ' data');

            if (ws.isFn(options.request)) {
              return options.request(url.value, dynamicOptions, function(
                err,
                chartProperties
              ) {
                if (err) return ws.snackBar('import error: ' + err);
                events.emit(
                  'ImportChartSettings',
                  chartProperties,
                  options.newFormat
                );
              });
            }

            ws.ajax({
              url: url.value,
              type: 'get',
              dataType: options.fetchAs || 'text',
              success: function(val) {
                options.filter(val, ws.merge({}, dynamicOptions), function(
                  error,
                  val
                ) {
                  if (error) return ws.snackBar('import error: ' + error);
                  if (options.treatAs === 'csv') {
                    csvTab.focus();
                    csvPasteArea.value = val;
                    emitCSVImport(val);
                  } else {
                    processJSONImport(val);
                  }
                });
              },
              error: function(err) {
                ws.snackBar('import error: ' + err);
              }
            });
          });

          webSplitter.right.innerHTML = '';

          ws.dom.ap(
            webSplitter.right,
            ws.dom.ap(
              ws.dom.cr('div', 'ws-plugin-details'),
              ws.dom.cr(
                'div',
                'ws-customizer-table-heading',
                options.title || name
              ),
              ws.dom.cr('div', 'ws-imp-help', options.description),
              urlTitle,
              url,
              Object.keys(options.options || {}).length
                ? dynamicOptionsContainer
                : false,
              ws.dom.cr('br'),
              importBtn
            )
          );
        }

        webList.addItem({
          id: name,
          title: webImports[name].title || name,
          click: buildBody
        });
      });

      webList.selectFirst();
    }

    function buildSampleTab() {
      samplesTab.innerHTML = '';

      ws.samples.each(function(sample) {
        var data = sample.dataset.join('\n'),
          loadBtn = ws.dom.cr(
            'button',
            'ws-box-size ws-imp-button',
            sample.title
          );

        ws.dom.style(loadBtn, { width: '99%' });

        ws.dom.on(loadBtn, 'click', function() {
          emitCSVImport(data);
          csvPasteArea.value = data;
          csvTab.focus();
        });

        ws.dom.ap(
          samplesTab.body,
          //ws.dom.cr('div', '', name),
          //ws.dom.cr('br'),
          loadBtn,
          ws.dom.cr('br')
        );
      });
    }

    function emitCSVImport(csv, cb) {
      events.emit('ImportCSV', {
        itemDelimiter: delimiter.value,
        firstRowAsNames: firstAsNames.checked,
        dateFormat: dateFormat.value,
        csv: csv || csvPasteArea.value,
        decimalPoint: decimalPoint.value
      }, cb);
    }

    function loadCSVExternal(csv) {
      csvPasteArea.value = csv;
      emitCSVImport();
    }

    function processJSONImport(jsonString) {
      var json = jsonString;
      if (ws.isStr(json)) {
        try {
          json = JSON.parse(jsonString);
        } catch (e) {
          ws.snackBar('Error parsing json: ' + e);
          return false;
        }
      }
      events.emit('ImportJSON', json);
      ws.snackBar('imported json');
    }

    /** Force a resize of the widget
     *  @memberof ws.DataImporter
     *  @param w {number} - the new width
     *  @param h {number} - the new height
     */
    function resize(w, h) {
      var bsize,
        ps = ws.dom.size(parent);

      tabs.resize(w || ps.w, h || ps.h);
      bsize = tabs.barSize();
      webSplitter.resize(w || ps.w, (h || ps.h) - bsize.h - 20);
      webList.resize(w || ps.w, (h || ps.h) - bsize.h);

      exporter.resize(null, 300);
    }

    /** Show the importer
     *  @memberof ws.DataImporter
     */
    function show() {
      tabs.show();
    }

    /** Hide the importer
     *  @memberof ws.DataImporter
     */
    function hide() {
      tabs.hide();
    }

    function addImportTab(tabOptions){
      var newTab = tabs.createTab({ title: tabOptions.name || 'Features' });

      if (ws.isFn(tabOptions.create)) {
        tabOptions.create(newTab.body);
      }
      if (tabOptions.resize) {
        newTab.on('Focus',function() {
          ws.dom.style(parent, { width: tabOptions.resize.width + 'px', height: tabOptions.resize.height + 'px' });
          newTab.resize(tabOptions.resize.width - 10, tabOptions.resize.height - 10);
        });
      }
    }

    function selectTab(index) {
      tabs.select(index);
    }
    ///////////////////////////////////////////////////////////////////////////

    ws.dom.ap(
      exportTab.body,
      commaDelimitedBtn,
      semicolonDelimitedBtn,
      ws.dom.cr('hr', 'ws-imp-hr')
    );


    var exporter = ws.Exporter(exportTab.body);
    exporter.resize(null, 300);

    ws.dom.ap(
      csvTab.body,
      spreadsheetImportBtn,
      liveDataImportBtn,
      csvImportFileBtn,
      ws.dom.cr('hr', 'ws-imp-hr'),
      ws.dom.cr(
        'div',
        'ws-imp-help',
        'Paste CSV into the below box, or upload a file. Click Import to import your data.'
      ),
      csvPasteArea,

      // ws.dom.cr('span', 'ws-imp-label', 'Delimiter'),
      // delimiter,
      // ws.dom.cr('br'),

      // ws.dom.cr('span', 'ws-imp-label', 'Date Format'),
      // dateFormat,
      // ws.dom.cr('br'),

      // ws.dom.cr('span', 'ws-imp-label', 'Decimal Point Notation'),
      // decimalPoint,
      // ws.dom.cr('br'),

      // ws.dom.cr('span', 'ws-imp-label', 'First Row Is Series Names'),
      // firstAsNames,
      // ws.dom.cr('br'),

      csvImportBtn
    );

    ws.dom.ap(
      jsonTab.body,
      ws.dom.cr(
        'div',
        'ws-imp-help',
        'Paste JSON into the below box, or upload a file. Click Import to import your data. <br/><b>The JSON is the data passed to the chart constructor, and may contain any of the valid <a href="http://api.highcharts.com/highcharts/" target="_blank">options</a>.</b>'
      ),
      jsonPasteArea,
      jsonImportFileBtn,
      jsonImportBtn
    );

    ws.dom.on(commaDelimitedBtn, 'click', function(){
      events.emit('ExportComma');
    });

    ws.dom.on(semicolonDelimitedBtn, 'click', function(){
      events.emit('ExportSemiColon');
    });

    ws.dom.on(spreadsheetImportBtn, 'click', function(){
      events.emit('ImportGoogleSpreadsheet');
    });

    ws.dom.on(csvImportBtn, 'click', function() {
      emitCSVImport();
    });

    ws.dom.on(liveDataImportBtn, 'click', function () {
      events.emit('ImportLiveData', {
      //  url: liveDataInput.value
      });
    });

    ws.dom.on(csvPasteArea, 'keyup', function(e) {
      if (e.keyCode === 13 || ((e.metaKey || e.ctrlKey) && e.key === 'z')) {
        emitCSVImport(csvPasteArea.value);
      }
    });

    ws.dom.on(csvImportFileBtn, 'click', function() {
      ws.readLocalFile({
        type: 'text',
        accept: '.csv',
        success: function(info) {
          csvPasteArea.value = info.data;
          ws.snackBar('File uploaded');
          emitCSVImport();
        }
      });
    });

    ws.dom.on(jsonImportBtn, 'click', function() {
      processJSONImport(jsonPasteArea.value);
    });

    ws.dom.on(jsonImportFileBtn, 'click', function() {
      ws.readLocalFile({
        type: 'text',
        accept: '.json',
        success: function(info) {
          jsonPasteArea.value = info.data;
          processJSONImport(info.data);
        }
      });
    });

    buildSampleTab();
    buildWebTab();
    updateOptions();

    delimiter.value = ',';
    //dateFormat.value = 'YYYY-mm-dd';
    firstAsNames.type = 'checkbox';
    decimalPoint.value = '.';
    firstAsNames.checked = true;

    //Should hide the web tab if running where cross-origin is an issue

    resize();

    ///////////////////////////////////////////////////////////////////////////

    return {
      on: events.on,
      loadCSV: loadCSVExternal,
      resize: resize,
      show: show,
      hide: hide,
      addImportTab: addImportTab,
      exporter: exporter,
      selectTab: selectTab,
      emitCSVImport: emitCSVImport
    };
  };
})();
