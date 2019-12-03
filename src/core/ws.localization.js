

// @format

/*
    Note that the localization system uses attribute names
    rather than a default string. This is to make it easier to
    modify translations.

*/

(function() {
  var currentLang = ws.option('defaultLanguage'),
    langTree = {};

  /** Get a localized string based on the current global language
     *  @param id {string} - the ID of the string to get
     */
  ws.getLocalizedStr = function(id) {
    if (langTree[currentLang]) {
      if (langTree[currentLang][id]) {
        return langTree[currentLang][id];
      }
    } else {
      //The current language is invalid, fall back to 'en'
      if (langTree.en[id]) {
        return langTree.en[id];
      }
    }

    //404
    return 'bad localized string: ' + id;
  };

  /** This is an alias for ws.getLocalizedStr
     *  @type {function}
     *  @param id {string} - the string to get
     */
  ws.L = ws.getLocalizedStr;

  /** Install a language pack from a json object
     *  @param translations {object} - translation object
     */
  ws.installLanguage = function(translations) {
    if (translations && translations.language && translations.entries) {
      langTree[translations.language] = translations.entries;
    }
  };

  /** Install a language pack from a url
     *  @param url {string} - the location of the pack
     */
  ws.installLanguageFromURL = function(url, fn) {
    ws.ajax({
      url: url,
      success: function(res) {
        if (res) {
          if (ws.installLanguage(res)) {
            return fn && fn(false);
          }
          return fn && fn(true);
        }
      },
      error: function(err) {
        return fn && fn(err);
      }
    });
  };

  /** Set the active language
     *  @param lang {string} - the language to activate
     *  @return {boolean} - true if the language exists, and was applied
     */
  ws.setLang = function(lang) {
    if (langTree[lang]) {
      currentLang = lang;
      return true;
    }
    return false;
  };
})();
