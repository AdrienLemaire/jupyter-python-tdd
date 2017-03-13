var liveNotebook = !(typeof IPython == "undefined")
  function incr_lbl(ary, h_idx){//increment heading label  w/ h_idx (zero based)
    ary[h_idx]++;
    for(var j= h_idx+1; j < ary.length; j++){ ary[j]= 0; }
    return ary.slice(0, h_idx+1);
  }

function handle_output(out){
  res = null;
  // if output is a print statement
  if(out.msg_type == "stream"){
    res = out.content.text;
  }
  // if output is a python object
  else if(out.msg_type === "execute_result"){
    res = out.content.data["text/plain"];
  }
  // if output is a python error
  else if(out.msg_type == "pyerr"){
    res = out.content.ename + ": " + out.content.evalue;
  }
  // if output is something we haven't thought of
  else{
    res = "[out type not implemented]";
    console.dir(out);
  }

  document.getElementById('tdd').innerText += res.replace('__main__.','');

  resArray = res.match(/[^\r\n]+/g);
  resHtml = '';
  if (resArray[resArray.length-1] == 'OK') {
    $('#tdd_button .fa').removeClass('tdd-red');
    $('#tdd_button .fa').addClass('tdd-green');
    $('#tdd-header').removeClass('tdd-red');
    $('#tdd-header').addClass('tdd-green');
    $('#tdd-header').text('All passed!')

  } else {
    $('#tdd_button .fa').removeClass('tdd-green');
    $('#tdd_button .fa').addClass('tdd-red');
    $('#tdd-header').removeClass('tdd-green');
    $('#tdd-header').addClass('tdd-red');
    $('#tdd-header').text('Failed')
  }
}


function run_tests() {
  var IPythonKernel = IPython.notebook.metadata.kernelspec.language == "python";
  if (IPythonKernel) {
    codelines = $('.code_cell .CodeMirror').text();
    var test_runner = 'tdd_loader = unittest.TestLoader();'+
                      'tdd_suite = unittest.TestSuite();';

    // Load all TestCases
    re_class = /class (\w+Test)/gm;
    while ((testClass = re_class.exec(codelines)) !== null) {
      var test_runner = test_runner + 'tdd_suite.addTests(tdd_loader.loadTestsFromModule('+testClass[1]+'()));';
    }

    // Clear previous output
    $("#tdd").empty()

    // Execute tests
    test_runner = test_runner + 'unittest.TextTestResult.separator2 = "-"*40;'+
            'unittest.TextTestResult.separator1 = "="*40;'+
            'tdd_runner = unittest.TextTestRunner(failfast=True, buffer=True, verbosity=2);'+
            //'tdd_runner = unittest.TextTestRunner(failfast=True, buffer=True, verbosity=2);'+
            'tdd_runner.run(tdd_suite);';
    var kernel = IPython.notebook.kernel;
    var callbacks = { 'iopub' : {'output' : handle_output}};
    var msg_id = kernel.execute(test_runner, callbacks);
  } else {
    alert("Sorry; this only works with a IPython kernel");
  }
}


var create_navigate_menu = function(callback) {
  $('#kernel_menu').parent().after('<li id="Navigate"/>')
  $('#Navigate').addClass('dropdown').append($('<a/>').attr('href', '#').attr('id', 'Navigate_sub'))
  $('#Navigate_sub').text('Navigate').addClass('dropdown-toggle').attr('data-toggle', 'dropdown')
  $('#Navigate').append($('<ul/>').attr('id', 'Navigate_menu').addClass('dropdown-menu')
    .append($("<div/>").attr("id", "navigate_menu").addClass('tdd')))

  if (IPython.notebook.metadata.tdd['nav_menu']) {
    $('#Navigate_menu').css(IPython.notebook.metadata.tdd['nav_menu'])
    $('#navigate_menu').css('width', $('#Navigate_menu').css('width'))
    $('#navigate_menu').css('height', $('#Navigate_menu').height())
  } else {
    IPython.notebook.metadata.tdd.nav_menu = {};
     $([IPython.events]).on("before_save.Notebook",
    function(){
      try
      {
       IPython.notebook.metadata.tdd.nav_menu['width'] = $('#Navigate_menu').css('width')
       IPython.notebook.metadata.tdd.nav_menu['height'] = $('#Navigate_menu').css('height')
      }
      catch(e)
      {
     console.log("[tdd] Error in metadata (navigation menu) - Proceeding",e)
     }
    })
  }

  $('#Navigate_menu').resizable({
    resize: function(event, ui) {
      $('#navigate_menu').css('width', $('#Navigate_menu').css('width'))
      $('#navigate_menu').css('height', $('#Navigate_menu').height())
    },
    stop: function(event, ui) {
      IPython.notebook.metadata.tdd.nav_menu['width'] = $('#Navigate_menu').css('width')
      IPython.notebook.metadata.tdd.nav_menu['height'] = $('#Navigate_menu').css('height')
    }
  })

  callback && callback();
}


var create_tdd_div = function (cfg,st) {
  var tdd_wrapper = $('<div id="tdd-wrapper"/>')
  .append(
    $('<div id="tdd-header"/>')
    .addClass("header")
    .text("TDD")
    .append(
    $("<a/>")
    .attr("href", "#")
    .addClass("hide-btn")
    .attr('title', 'Hide TDD')
    .text("[-]")
    .click( function(){
      $('#tdd').slideToggle({'complete': function(){ if(liveNotebook){
      IPython.notebook.metadata.tdd['tdd_section_display']=$('#tdd').css('display');
      IPython.notebook.set_dirty();}}
        });
      $('#tdd-wrapper').toggleClass('closed');
      if ($('#tdd-wrapper').hasClass('closed')){
        st.oldTddHeight = $('#tdd-wrapper').css('height');
        $('#tdd-wrapper').css({height: 40});
        $('#tdd-wrapper .hide-btn')
        .text('[+]')
        .attr('title', 'Show TDD');
      } else {
       // $('#tdd-wrapper').css({height: IPython.notebook.metadata.tdd.tdd_position['height']});
       // $('#tdd').css({height: IPython.notebook.metadata.tdd.tdd_position['height']});
        $('#tdd-wrapper').css({height: st.oldTddHeight});
        $('#tdd').css({height: st.oldTddHeight});
        $('#tdd-wrapper .hide-btn')
        .text('[-]')
        .attr('title', 'Hide TDD');
      }
      return false;
      })
    ).append(
    $("<a/>")
    .attr("href", "#")
    .addClass("reload-btn")
    .text("  \u21BB")
    .attr('title', 'Reload TDD')
    .click( function(){
      test_runner(cfg,st);
      return false;
    })
    ).append(
    $("<span/>")
    .html("&nbsp;&nbsp")
    )
  ).append(
    $("<div/>").attr("id", "tdd").addClass('tdd')
  )

  $("body").append(tdd_wrapper);


  // enable dragging and save position on stop moving
  $('#tdd-wrapper').draggable({

      drag: function( event, ui ) {

    // If dragging to the left side, then transforms in sidebar
    wrapper_width = parseInt($('#tdd-wrapper').css('width'), 10);
    if ((ui.position.left >= $('#notebook').width()-wrapper_width) && (cfg.sideBar==false)){
      cfg.sideBar = true;
      st.oldTddHeight = $('#tdd-wrapper').css('height');
      if(liveNotebook){
      IPython.notebook.metadata.tdd['sideBar']=true;
      IPython.notebook.set_dirty();}
      tdd_wrapper.removeClass('float-wrapper').addClass('sidebar-wrapper');
      $('#notebook-container').css('margin-right',wrapper_width+30);
      $('#notebook-container').css('width',$('#notebook').width()-wrapper_width-30);
      ui.position.top = liveNotebook ? $('#header').height() : 0;
      ui.position.left = $('#notebook').width()-wrapper_width;
      if(liveNotebook){
      $('#tdd-wrapper').css('height',$('#site').height());}
      else{
      $('#tdd-wrapper').css('height','96%');}
      $('#tdd').css('height', $('#tdd-wrapper').height()-$('#tdd-header').height());
    }
    if (ui.position.left >= $('#notebook').width()-wrapper_width) {
      ui.position.left = $('#notebook').width()-wrapper_width;
      ui.position.top = liveNotebook ? $('#header').height() : 0;
    }
    if ((ui.position.left < $('#notebook').width()-wrapper_width) && (cfg.sideBar==true)) {
      cfg.sideBar = false;
      if(liveNotebook){
      IPython.notebook.metadata.tdd['sideBar']=false;
      IPython.notebook.set_dirty(); }
      if (st.oldTddHeight==undefined) st.oldTddHeight=Math.max($('#site').height()/2,200)
      $('#tdd-wrapper').css('height',st.oldTddHeight);
      tdd_wrapper.removeClass('sidebar-wrapper').addClass('float-wrapper');
      $('#notebook-container').css('margin-right',30);
      $('#notebook-container').css('width',$('#notebook').width()-30);
      $('#tdd').css('height', $('#tdd-wrapper').height()-$('#tdd-header').height()); //redraw at begin of of drag (after resizing height)

    }
    }, //end of drag function
      start : function(event, ui) {
        $(this).width($(this).width());
      },
      stop :  function (event,ui){ // on save, store tdd position
    if(liveNotebook){
      IPython.notebook.metadata.tdd['tdd_position']={
      'left':$('#tdd-wrapper').css('left'),
      'top':$('#tdd-wrapper').css('top'),
      'width':$('#tdd-wrapper').css('width'),
      'height':$('#tdd-wrapper').css('height'),
      'right':$('#tdd-wrapper').css('right')};
      IPython.notebook.set_dirty();}
      // Ensure position is fixed (again)
      $('#tdd-wrapper').css('position', 'fixed');
      },
  });


  $('#tdd-wrapper').resizable({
    resize : function(event,ui){
      if (cfg.sideBar){
       $('#notebook-container').css('margin-right',wrapper_width+30)
       $('#notebook-container').css('width',$('#notebook').width()-wrapper_width-30)
      }
      else {
      $('#tdd').css('height', $('#tdd-wrapper').height()-$('#tdd-header').height());
      }
    },
      start : function(event, ui) {
          $(this).width($(this).width());
          //$(this).css('position', 'fixed');
        },
      stop :  function (event,ui){ // on save, store tdd position
        if(liveNotebook){
          IPython.notebook.metadata.tdd['tdd_position']={
          'left':$('#tdd-wrapper').css('left'),
          'top':$('#tdd-wrapper').css('top'),
          'height':$('#tdd-wrapper').css('height'),
          'width':$('#tdd-wrapper').css('width'),
          'right':$('#tdd-wrapper').css('right')};
          $('#tdd').css('height', $('#tdd-wrapper').height()-$('#tdd-header').height())
          IPython.notebook.set_dirty();
        }
        // Ensure position is fixed (again)
        //$(this).css('position', 'fixed');
      }
    })


  // restore tdd position at load
  if(liveNotebook){
  if (IPython.notebook.metadata.tdd['tdd_position'] !== undefined){
      $('#tdd-wrapper').css(IPython.notebook.metadata.tdd['tdd_position']);
      }
    }
  // Ensure position is fixed
    $('#tdd-wrapper').css('position', 'fixed');

  // Restore tdd display
  if(liveNotebook){
    if (IPython.notebook.metadata.tdd !== undefined) {
    if (IPython.notebook.metadata.tdd['tdd_section_display']!==undefined)  {
      $('#tdd').css('display',IPython.notebook.metadata.tdd['tdd_section_display'])
      $('#tdd').css('height', $('#tdd-wrapper').height()-$('#tdd-header').height())
      if (IPython.notebook.metadata.tdd['tdd_section_display']=='none'){
        $('#tdd-wrapper').addClass('closed');
        $('#tdd-wrapper').css({height: 40});
        $('#tdd-wrapper .hide-btn')
        .text('[+]')
        .attr('title', 'Show TDD');
      }
    }
    if (IPython.notebook.metadata.tdd['tdd_window_display']!==undefined)  {
      console.log("******Restoring tdd display");
      $('#tdd-wrapper').css('display',IPython.notebook.metadata.tdd['tdd_window_display'] ? 'block' : 'none');
      //$('#tdd').css('overflow','auto')
    }
    }
  }

  // if tdd-wrapper is undefined (first run(?), then hide it)
  if ($('#tdd-wrapper').css('display')==undefined) $('#tdd-wrapper').css('display',"none") //block

  $('#site').bind('siteHeight', function() {
  if (cfg.sideBar) $('#tdd-wrapper').css('height',$('#site').height());})

  $('#site').trigger('siteHeight');

  // Initial style
  ///sideBar = cfg['sideBar']
  if (cfg.sideBar) {
    $('#tdd-wrapper').addClass('sidebar-wrapper');
    if (!liveNotebook) {
      $('#tdd-wrapper').css('width', '202px');
      $('#notebook-container').css('margin-right', '212px');
      $('#tdd-wrapper').css('height', '96%');
      $('#tdd').css('height', $('#tdd-wrapper').height() - $('#tdd-header').height())
    } else {
      if (cfg.tdd_window_display) {
        setTimeout(function() {
        $('#notebook-container').css('width', $('#notebook').width() - $('#tdd-wrapper').width() - 30);
        $('#notebook-container').css('margin-right', $('#tdd-wrapper').width() + 30);
         }, 500)
      }
      setTimeout(function() {
        $('#tdd-wrapper').css('height', $('#site').height());
        $('#tdd').css('height', $('#tdd-wrapper').height() - $('#tdd-header').height())
      }, 500)
    }
    setTimeout(function() { $('#tdd-wrapper').css('top', liveNotebook ? $('#header').height() : 0); }, 500) //wait a bit
    $('#tdd-wrapper').css('right', 0);

  }

  else {
    tdd_wrapper.addClass('float-wrapper');
  }
}

// Test Runner =================================================================
var test_runner = function (cfg,st) {
  if(st.rendering_tdd_cell) { // if tdd_cell is rendering, do not call  test_runner,
    st.rendering_tdd_cell=false;  // otherwise it will loop
    return}

  var tdd_wrapper = $("#tdd-wrapper");
   // var tdd_index=0;
  if (tdd_wrapper.length === 0) {
    create_tdd_div(cfg,st);
  }
  var segments = [];

  st.cell_tdd = undefined;
   // if cfg.tdd_cell=true, add and update a tdd cell in the notebook.

  if(liveNotebook){
    run_tests();
  }

  var cell_tdd_text = "# Test Runner\n <p>";
  $(window).resize(function(){
    $('#tdd').css({maxHeight: $(window).height() - 30});
    $('#tdd-wrapper').css({maxHeight: $(window).height() - 10});

    if (cfg.sideBar==true) {
      if ($('#tdd-wrapper').css('display')!='block'){
      $('#notebook-container').css('margin-right',30);
      $('#notebook-container').css('width',$('#notebook').width()-30);
      }
      else{
      $('#notebook-container').css('margin-right',$('#tdd-wrapper').width()+30);
      $('#notebook-container').css('width',$('#notebook').width()-$('#tdd-wrapper').width()-30);
      $('#tdd-wrapper').css('height',liveNotebook ? $('#site').height(): $(window).height() - 10);
      $('#tdd-wrapper').css('top', liveNotebook ? $('#header').height() : 0);
      $('#tdd-wrapper').css('left', liveNotebook ? $('#notebook').width()-$('#tdd-wrapper').width() : 0);
      }
    } else{
      $('#notebook-container').css('margin-right',30);
      $('#notebook-container').css('width',$('#notebook').width()-30);
    }
  });
  $(window).trigger('resize');
};

var toggle_tdd = function (cfg,st) {
  // toggle draw (first because of first-click behavior)
  //$("#tdd-wrapper").toggle({'complete':function(){
  $("#tdd-wrapper").toggle({
    'progress':function(){
      if (cfg.sideBar==true) {
        if ($('#tdd-wrapper').css('display')!='block'){
        $('#notebook-container').css('margin-right',st.nbcontainer_marginright);
        $('#notebook-container').css('width',st.nbcontainer_width);
        }
        else{
        $('#notebook-container').css('margin-right',$('#tdd-wrapper').width()+30)
        $('#notebook-container').css('width',$('#notebook').width()-$('#tdd-wrapper').width()-30)
        }
      }
    },
    'complete': function(){
      if(liveNotebook){
      IPython.notebook.metadata.tdd['tdd_window_display']=$('#tdd-wrapper').css('display')=='block';
      IPython.notebook.set_dirty();
      }
      // recompute:
      st.rendering_tdd_cell = false;
      test_runner(cfg,st);
    }
  });
};
