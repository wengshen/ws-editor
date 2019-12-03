

// @format

/**
 * @ignore
 */
ws.ready(function() {
  var uploader = ws.dom.cr('input'),
    cb = false;

  uploader.type = 'file';
  uploader.accept = '.csv';

  ws.dom.ap(document.body, uploader);

  ws.dom.style(uploader, {
    display: 'none'
  });

  /** Upload and parse a local file
  *  Borrowed from almostvanilla which is licensed under MIT.
  *  @param props {object} - the upload settings
  *     > type {string} - the type of data to load
  *     > accept {string} - the accepted file extensions
  *     > multiple {boolean} - allow multiple files
  *     > progress {function} - progress callback
  *       > {number} - the progress in percent
  *     > success {function} - function called when the file is uploaded
  *       > {object} - the file information
  *         > filename {string} - the name of the file
  *         > size {number} - the size of the file in bytes
  *         > data {string} - the file data
  */
  ws.readLocalFile = function(props) {
    var p = ws.merge(
      {
        type: 'text',
        multiple: false,
        accept: '.csv'
      },
      props
    );

    uploader.accept = p.accept;

    if (ws.isFn(cb)) {
      cb();
    }

    cb = ws.dom.on(uploader, 'change', function() {
      function crReader(file) {
        var reader = new FileReader();

        reader.onloadstart = function(evt) {
          if (ws.isFn(p.progress)) {
            p.progress(Math.round(evt.loaded / evt.total * 100));
          }
        };

        reader.onload = function(event) {
          var data = reader.result;

          if (p.type === 'json') {
            try {
              data = JSON.parse(data);
            } catch (e) {
              if (ws.isFn(p.error)) {
                p.error(e);
              }
            }
          }

          if (ws.isFn(p.success)) {
            p.success({
              filename: file.name,
              size: file.size,
              data: data
            });
          }
        };

        return reader;
      }

      for (var i = 0; i < uploader.files.length; i++) {
        if (!p.type || p.type === 'text' || p.type === 'json') {
          crReader(uploader.files[i]).readAsText(uploader.files[i]);
        } else if (p.type === 'binary') {
          crReader(uploader.files[i]).readAsBinaryString(uploader.files[i]);
        } else if (p.type === 'b64') {
          crReader(uploader.files[i]).readAsDataURL(uploader.files[i]);
        }
      }
      cb();
      uploader.value = '';
    });

    uploader.multiple = p.multiple;

    uploader.click();
  };
});
