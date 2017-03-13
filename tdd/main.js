// Adapted from https://gist.github.com/magican/5574556
// by minrk https://github.com/minrk/ipython_extensions
// See the history of contributions in README.md


//define(["require", "jquery", "base/js/namespace",  'services/config',
//  'base/js/utils', "nbextensions/tdd/tdd"], function(require, $, IPython, configmod, utils, tdd) {

define(["require", "jquery", "base/js/namespace",  'services/config',
  'base/js/utils', 'notebook/js/codecell', "nbextensions/tdd/tdd"], function(require, $, IPython, configmod, utils, codecell, tdd ) {

  var Notebook = require('notebook/js/notebook').Notebook
  "use strict";


  // ...........Parameters configuration......................
  // define default values for config parameters if they were not present in general settings (notebook.json)
  var cfg={
    'threshold':4,
    'tdd_cell':false,
    'tdd_window_display':false,
    'tdd_section_display': 'block',
    'sideBar':true,
	  'navigate_menu':true,
    'moveMenuRight': true,
  }

  //.....................global variables....
  var liveNotebook = !(typeof IPython == "undefined")

  var st={}
  st.rendering_tdd_cell = false;
  st.config_loaded = false;
  st.extension_initialized=false;

  st.nbcontainer_marginleft = $('#notebook-container').css('margin-left')
  st.nbcontainer_marginright = $('#notebook-container').css('margin-right')
  st.nbcontainer_width = $('#notebook-container').css('width')
  st.oldTddHeight = undefined

  st.cell_tdd = undefined;
  st.tdd_index=0;

  function read_config(cfg, callback) { // read after nb is loaded
    // create config object to load parameters
    var base_url = utils.get_body_data("baseUrl");
    var initial_cfg = $.extend(true, {}, cfg);
    var config = new configmod.ConfigSection('notebook', { base_url: base_url });
    config.loaded.then(function(){
      // config may be specified at system level or at document level.
      // first, update defaults with config loaded from server
      cfg = $.extend(true, cfg, config.data.tdd);
      // then update cfg with any found in current notebook metadata
      // and save in nb metadata (then can be modified per document)
      cfg = IPython.notebook.metadata.tdd = $.extend(true, cfg,
        IPython.notebook.metadata.tdd);
      // excepted colors that are taken globally (if defined)
      cfg.colors = IPython.notebook.metadata.tdd.colors = $.extend(true, {}, initial_cfg.colors);
      try
       {cfg.colors = IPython.notebook.metadata.tdd.colors = $.extend(true, cfg.colors, config.data.tdd.colors);  }
      catch(e) {}
      // and moveMenuRight taken globally (if it exists, otherwise default)
      cfg.moveMenuRight = IPython.notebook.metadata.tdd.moveMenuRight = initial_cfg.moveMenuRight;
      if (config.data.tdd) {
        if (typeof config.data.tdd.moveMenuRight !== "undefined") {
          cfg.moveMenuRight = IPython.notebook.metadata.tdd.moveMenuRight = config.data.tdd.moveMenuRight;
        }
      }
      // call callbacks
      callback && callback();
      st.config_loaded = true;
    })
    config.load();
    return cfg;
  }


  // **********************************************************************
  
  //***********************************************************************
  // ----------------------------------------------------------------------

  function toggleTdd() {
    toggle_tdd(cfg,st)
  }

  var tdd_button = function () {
  if (!IPython.toolbar) {
    $([IPython.events]).on("app_initialized.NotebookApp", tdd_button);
    return;
  }
  if ($("#tdd_button").length === 0) {
    IPython.toolbar.add_buttons_group([
    {
      'label'   : 'Test Runner',
      'icon'  : 'fa-check-square-o',
      'callback':  toggleTdd,
      'id'    : 'tdd_button'
    }
    ]);
  }
  };

  var load_css = function () {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = require.toUrl("./main.css");
    document.getElementsByTagName("head")[0].appendChild(link);
  };

  var CodeCell = codecell.CodeCell;

  function patch_CodeCell_get_callbacks() {
    var previous_get_callbacks = CodeCell.prototype.get_callbacks;
    CodeCell.prototype.get_callbacks = function() {
      var that = this;
      var callbacks = previous_get_callbacks.apply(this, arguments);
      var prev_reply_callback = callbacks.shell.reply;
      callbacks.shell.reply = function(msg) {
        if (msg.msg_type === 'execute_reply') {
          setTimeout(function(){
            run_tests();
          }, 100);
          var c = IPython.notebook.get_selected_cell();
          run_tests();
        }
        return prev_reply_callback(msg);
      };
      return callbacks;
    };
  }


  function execute_codecell_callback(evt, data) {
    var cell = data.cell;
    run_tests();
  }

  var tdd_init = function() {
    // read configuration, then call tdd
    cfg = read_config(cfg, function() { test_runner(cfg, st); }); // called after config is stable
    // event: render tdd for each markdown cell modification
    $([IPython.events]).on("rendered.CodeCell",
      function(evt, data) {
        test_runner(cfg, st); // recompute the tdd
        run_tests();
      });
    patch_CodeCell_get_callbacks();
    $([Jupyter.events]).on('execute.CodeCell', execute_codecell_callback);
  }

  var load_ipython_extension = function() {
    load_css(); //console.log("Loading css")
    tdd_button(); //console.log("Adding tdd_button")

    // Wait for the notebook to be fully loaded
    if (Jupyter.notebook._fully_loaded) {
      // this tests if the notebook is fully loaded
      console.log("[tdd] Notebook fully loaded -- tdd initialized ")
      tdd_init();
    } else {
      console.log("[tdd] Waiting for notebook availability")
      $([Jupyter.events]).on("notebook_loaded.Notebook", function() {
        console.log("[tdd] tdd initialized (via notebook_loaded)")
        tdd_init();
      })
    }

  };

  return {
    load_ipython_extension : load_ipython_extension,
    toggle_tdd : toggle_tdd,
    test_runner : test_runner
  };
});
