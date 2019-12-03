

// @format

(function() {
  function createTeamDropDown(target) {
    var dropdown = ws.DropDown(target);

    function refresh() {
      dropdown.clear();

      ws.cloud.getTeams(function(teamCollection) {
        teamCollection.forEach(function(team) {
          dropdown.addItem({
            id: team.id,
            title: team.name
          });
        });

        dropdown.selectByIndex(0);
      });
    }

    return {
      refresh: refresh,
      dropdown: dropdown
    };
  }

  var chartPreview = false,
    modal = ws.OverlayModal(document.body, {
      //eslint-disable-line no-undef
      showOnInit: false,
      width: '90%',
      height: '90%',
      zIndex: 10001
    }),
    mainContainer = ws.dom.cr('div'),
    charts = ws.dom.cr('div', 'ws-cloud-chart-container'),
    teams = createTeamDropDown(mainContainer),
    pageNavigation = ws.dom.cr('div', 'ws-cloud-paging'),
    activeTeam,
    activeChart,
    saveNewModal = ws.OverlayModal(document.body, {
      //eslint-disable-line no-undef
      showOnInt: false,
      width: 400,
      height: 300,
      zIndex: 10001
    }),
    saveNewTeamsContainer = ws.dom.cr('div'),
    saveNewTeams = createTeamDropDown(saveNewTeamsContainer),
    saveNewName = ws.dom.cr('input', 'ws-field-input'),
    saveNewBtn = ws.dom.cr('button', 'ws-ok-button', 'Save to cloud'),
    loginForm = false;

  ws.dom.ap(
    saveNewModal.body,
    ws.dom.cr('h2', 'ws-titlebar', 'Save to Cloud'),
    ws.dom.cr('div', '', 'Team'),
    saveNewTeamsContainer,
    ws.dom.cr('br'),
    ws.dom.cr('div', '', 'Chart Name'),
    saveNewName,
    saveNewBtn
  );

  ws.dom.on(saveNewBtn, 'click', function() {
    saveNewBtn.disabled = true;
    saveNewBtn.innerHTML = 'SAVING TO CLOUD...';

    ws.cloud.saveNewChart(
      activeTeam,
      saveNewName.value,
      JSON.stringify(chartPreview.toProject()),
      function(data) {
        saveNewBtn.disabled = false;
        if (!data.error && data) {
          activeChart = data;
          saveNewModal.hide();
          saveNewBtn.innerHTML = 'SAVE TO CLOUD';
          ws.snackBar('SAVED TO CLOUD');
        } else {
          ws.snackBar('Error saving to cloud');
        }
      }
    );
  });

  saveNewTeams.dropdown.on('Change', function(item) {
    activeTeam = item.id();
  });

  function addChart(chart) {
    var container = ws.dom.cr('div', 'ws-cloud-chart'),
      thumbnail = ws.dom.cr('div', 'ws-cloud-thumbnail');

    ws.dom.ap(
      charts,
      ws.dom.ap(
        container,
        thumbnail,
        ws.dom.cr('div', 'ws-cloud-chart-title', chart.name)
      )
    );

    ws.dom.style(thumbnail, {
      'background-image':
        'url(' + chart.thumbnail_url + '?t=' + new Date().getTime() + ')'
    });

    ws.dom.on(thumbnail, 'click', function() {
      if (chartPreview) {
        ws.cloud.getChart(chart.team_owner, chart.id, function(data) {
          try {
            chartPreview.loadProject(JSON.parse(data.data));
            activeChart = chart.id;
            activeTeam = chart.team_owner;
            modal.hide();
          } catch (e) {
            ws.snackbar(e);
          }
        });
      }
    });
  }

  ws.dom.ap(
    modal.body,
    ws.dom.cr(
      'h2',
      'ws-titlebar',
      'Load project from Highcharts Cloud'
    ),
    ws.dom.ap(mainContainer, charts, pageNavigation)
  );

  function getCharts(page, teamID) {
    // Load charts here
    charts.innerHTML = 'Loading Charts';
    ws.cloud.getCharts(
      teamID,
      function(chartCollection, full) {
        charts.innerHTML = '';
        pageNavigation.innerHTML = '';

        if (full.pageCount > 1) {
          for (var i = 1; i <= full.pageCount; i++) {
            (function(pageIndex) {
              var item = ws.dom.cr('span', 'ws-cloud-paging-item', i);

              if (pageIndex === page) {
                item.className += ' selected';
              }

              ws.dom.on(item, 'click', function() {
                getCharts(pageIndex, teamID);
              });

              ws.dom.ap(pageNavigation, item);
            })(i);
          }
        }

        chartCollection.forEach(addChart);
      },
      page
    );
  }

  teams.dropdown.on('Change', function(item) {
    getCharts(false, item.id());
  });

  ws.cloud.flush = function() {
    activeChart = false;
    activeTeam = false;
  };

  ws.cloud.save = function(chartp) {
    ws.cloud.loginForm(function() {
      saveNewName.value = '';
      saveNewName.focus();
      chartPreview = chartp || chartPreview;
      if (activeChart && activeTeam) {
        // Save project
        ws.cloud.saveExistingChart(
          activeTeam,
          activeChart,
          JSON.stringify(chartPreview.toProject()),
          function() {
            ws.snackbar('CHART SAVED TO CLOUD');
          }
        );
      } else {
        // Show save as new UI
        saveNewModal.show();
        saveNewTeams.refresh();
      }
    });
  };

  ws.cloud.showUI = function(preview) {
    ws.cloud.loginForm(function() {
      chartPreview = preview;
      modal.show();
      teams.refresh();
    });
  };

  function createLoginForm() {
    var body = ws.dom.cr('div', 'ws-cloud-login-container'),
      username = ws.dom.cr('input', 'ws-cloud-input'),
      password = ws.dom.cr('input', 'ws-cloud-input'),
      btn = ws.dom.cr('button', 'ws-ok-button', 'LOGIN'),
      notice = ws.dom.cr('div', 'ws-cloud-login-error'),
      loginCallback = false,
      modal = ws.OverlayModal(false, {
        height: 300,
        width: 250,
        zIndex: 10001
      });

    username.name = 'cloud-username';
    password.name = 'cloud-password';

    username.placeholder = 'E-Mail';
    password.placeholder = 'Your password';
    password.type = 'password';

    ws.dom.ap(
      modal.body,
      ws.dom.ap(
        body,
        ws.dom.cr('h3', '', 'Login to Highcharts Cloud'),
        notice,
        username,
        password,
        btn,
        ws.dom.cr(
          'div',
          'ws-cloud-login-notice',
          'Requires a Highcharts Cloud account'
        )
      )
    );

    ws.dom.on(btn, 'click', function() {
      btn.disabled = true;
      ws.dom.style(notice, { display: 'none' });

      ws.cloud.login(username.value, password.value, function(err, res) {
        btn.disabled = false;

        if (err || !res || typeof res.token === 'undefined') {
          notice.innerHTML =
            'Error: Check username/password (' + (err || res.message) + ')';
          ws.dom.style(notice, { display: 'block' });
        } else {
          modal.hide();
          if (ws.isFn(loginCallback)) {
            loginCallback();
          }
        }
      });
    });

    return function(fn) {
      loginCallback = fn || function() {};
      if (ws.cloud.isLoggedIn()) {
        loginCallback();
      } else {
        modal.show();
      }
    };
  }

  ws.cloud.loginForm = function(fn) {
    if (!loginForm) {
      loginForm = createLoginForm();
    }
    loginForm(fn);
  };
})();
