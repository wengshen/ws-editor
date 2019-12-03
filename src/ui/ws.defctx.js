

// @format

/** Create an instance of the default context menu
 *  This is shared accross the simple and full editor.
 *  @constructor
 *  @param chartPreview {ws.ChartPreview} - the chart preview for the menu
 */
ws.DefaultContextMenu = function(chartPreview) {
  var events = ws.events(),
    cmenu = ws.ContextMenu([
      {
        title: ws.getLocalizedStr('previewChart'),
        icon: 'bar-chart',
        click: function() {
          chartPreview.expand();
        }
      },
      '-',
      {
        title: ws.getLocalizedStr('newChart'),
        icon: 'file-o',
        click: function() {
          if (window.confirm(ws.getLocalizedStr('confirmNewChart'))) {
            chartPreview.new();
            events.emit('NewChart');
          }
        }
      },
      '-',
      {
        title: ws.getLocalizedStr('saveProject'),
        icon: 'floppy-o',
        click: function() {
          ws.download('chart.json', chartPreview.toProjectStr());
        }
      },
      {
        title: ws.getLocalizedStr('loadProject'),
        icon: 'folder-open-o',
        click: function() {
          ws.readLocalFile({
            type: 'text',
            accept: '.json',
            success: function(file) {
              try {
                file = JSON.parse(file.data);
              } catch (e) {
                return ws.snackBar('Error loading JSON: ' + e);
              }

              chartPreview.loadProject(file);
            }
          });
        }
      },
      '-',
      {
        title: 'Save to Cloud',
        icon: 'upload',
        click: function() {
          ws.cloud.save(chartPreview);
        }
      },
      {
        title: ws.getLocalizedStr('loadCloud'),
        icon: 'cloud',
        click: function() {
          ws.cloud.showUI(chartPreview);
        }
      },
      '-',
      {
        title: ws.getLocalizedStr('exportPNG'),
        icon: 'file-image-o',
        click: function() {
          chartPreview.data.export({});
        }
      },
      {
        title: ws.getLocalizedStr('exportJPEG'),
        icon: 'file-image-o',
        click: function() {
          chartPreview.data.export({ type: 'image/jpeg' });
        }
      },
      {
        title: ws.getLocalizedStr('exportSVG'),
        icon: 'file-image-o',
        click: function() {
          chartPreview.data.export({ type: 'image/svg+xml' });
        }
      },
      {
        title: ws.getLocalizedStr('exportPDF'),
        icon: 'file-pdf-o',
        click: function() {
          chartPreview.data.export({ type: 'application/pdf' });
        }
      },
      '-',
      {
        title: ws.getLocalizedStr('help'),
        icon: 'question-circle',
        click: function() {
          window.open(ws.option('helpURL'));
        }
      } //,
      // {
      //     title: ws.getLocalizedStr('licenseInfo'),
      //     icon: 'key',
      //     click: function () {
      //         ws.licenseInfo.show();
      //     }
      // }
    ]);

  return {
    on: events.on,
    show: cmenu.show
  };
};
