
// @format

// Alias to drawer editor
ws.Editor = ws.DrawerEditor;

(function() {
  var instanceCount = 0,
    installedPlugins = {},
    activePlugins = {},
    pluginEvents = ws.events(),
    stepPlugins = {};

  ///////////////////////////////////////////////////////////////////////////

  /** Install an editor plugin
      *
      *  Note that plugins must be enabled when creating the editor
      *  for it to be active.
      *
      *  @namespace ws.plugins.editor
      *
      *  @param name       {string} - the name of the plugin
      *  @param definition {object} - the plugin definition
      *     > meta {object}
      *         > version {string}
      *         > author {string}
      *         > homepage {string}
      *     > dependencies {array<string>} - URLs of script dependencies
      *     > options {object}
      *         > option_name {object}
      *             > type {string} - the type of the option
      *             > label {string} - the label
      *             > default {anything} - the default value
      */
  function install(name, definition) {
    var properties = ws.merge(
      {
        meta: {
          version: 'unknown',
          author: 'unknown',
          homepage: 'unknown'
        },
        dependencies: [],
        options: {}
      },
      definition
    );

    console.error('Warning: editor plugins are no longer supported.');

    properties.dependencies.forEach(ws.include);

    if (!ws.isNull(installedPlugins[name])) {
      return ws.log(1, 'plugin -', name, 'is already installed');
    }

    installedPlugins[name] = properties;
  }

  function use(name, options) {
    var plugin = installedPlugins[name],
      filteredOptions = {};

    console.error('Warning: editor plugins are no longer supported.');

    if (!ws.isNull(plugin)) {
      if (activePlugins[name]) {
        return ws.log(2, 'plugin -', name, 'is already active');
      }

      //Verify options
      Object.keys(plugin.options).forEach(function(key) {
        var option = plugin.options[key];
        if (ws.isBasic(option) || ws.isArr(option)) {
          ws.log(
            2,
            'plugin -',
            name,
            'unexpected type definition for option',
            key,
            'expected object'
          );
        } else {
          filteredOptions[key] =
            options[key] || plugin.options[key].default || '';

          if (option.required && ws.isNull(options[key])) {
            ws.log(1, 'plugin -', name, 'option', key, 'is required');
          }
        }
      });

      activePlugins[name] = {
        definition: plugin,
        options: filteredOptions
      };
      filteredOptions;

      if (ws.isFn(plugin.activate)) {
        activePlugins[name].definition.activate(filteredOptions);
      }

      pluginEvents.emit('Use', activePlugins[name]);
    } else {
      ws.log(2, 'plugin -', name, 'is not installed');
    }
  }

  //Public interface
  ws.plugins.editor = {
    install: install,
    use: use
  };

  //UI plugin interface
  ws.plugins.step = {
    install: function(def) {
      stepPlugins[def.title] = def;
    }
  };
})();
