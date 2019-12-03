

// @format

(function() {
  var token = false,
    url = ws.option('cloudAPIURL');

  // Set up namespace for the cloud API
  ws.cloud = {};

  ws.cloud.isLoggedIn = function() {
    return token !== false;
  };

  ws.cloud.login = function(username, password, fn) {
    url = ws.option('cloudAPIURL');

    ws.ajax({
      url: url + 'login',
      type: 'post',
      data: {
        username: username,
        password: password
      },
      success: function(data) {
        if (data && data.token) {
          token = data.token;
        }
        return ws.isFn(fn) && fn(typeof data.token === 'undefined', data);
      },
      error: function(err) {
        return ws.isFn(fn) && fn(err);
      }
    });
  };

  ws.cloud.getTeams = function(fn) {
    url = ws.option('cloudAPIURL');

    ws.ajax({
      url: url + 'teams',
      type: 'get',
      headers: {
        'X-Auth-Token': token
      },
      success: function(data) {
        if (data.error) {
          return ws.snackBar(data.message);
        }
        return ws.isFn(fn) && fn(data);
      }
    });
  };

  ws.cloud.getCharts = function(teamID, fn, page) {
    url = ws.option('cloudAPIURL');

    ws.ajax({
      url: url + 'team/' + teamID + '/charts/' + '?page=' + page,
      type: 'get',
      headers: {
        'X-Auth-Token': token
      },
      success: function(data) {
        if (data.error) {
          return ws.snackBar(data.message);
        }
        return ws.isFn(fn) && fn(data.data, data);
      }
    });
  };

  ws.cloud.getChart = function(teamID, chartID, fn) {
    url = ws.option('cloudAPIURL');

    ws.ajax({
      url: url + 'team/' + teamID + '/chart/' + chartID,
      type: 'get',
      headers: {
        'X-Auth-Token': token
      },
      success: function(data) {
        if (data.error) {
          return ws.snackBar(data.message);
        }
        return ws.isFn(fn) && fn(data);
      }
    });
  };

  ws.cloud.saveExistingChart = function(teamID, chartID, chart, fn) {
    url = ws.option('cloudAPIURL');

    ws.ajax({
      url: url + 'team/' + teamID + '/chart/' + chartID,
      type: 'post',
      headers: {
        'X-Auth-Token': token
      },
      data: {
        data: chart
      },
      success: function(data) {
        if (data.error) {
          return ws.snackbar(data.message);
        }
        return ws.isFn(fn) && fn(data);
      }
    });
  };

  ws.cloud.saveNewChart = function(teamID, name, chart, fn) {
    url = ws.option('cloudAPIURL');

    ws.ajax({
      url: url + 'team/' + teamID + '/chart',
      type: 'post',
      headers: {
        'X-Auth-Token': token
      },
      data: {
        name: name,
        data: chart
      },
      success: function(data) {
        if (data.error) {
          return ws.snackbar(data.message);
        }
        return ws.isFn(fn) && fn(data);
      }
    });
  };
})();
