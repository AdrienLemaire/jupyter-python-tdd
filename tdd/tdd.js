//---------------------------------------------------------------------

//......... utilitary functions............

var liveNotebook = !(typeof IPython == "undefined")

  function incr_lbl(ary, h_idx){//increment heading label  w/ h_idx (zero based)
      ary[h_idx]++;
      for(var j= h_idx+1; j < ary.length; j++){ ary[j]= 0; }
      return ary.slice(0, h_idx+1);
  }

var make_link = function(h, num_lbl) {
    var a = $("<a/>");
    a.attr("href", '#' + h.attr('id'));
    // get the text *excluding* the link text, whatever it may be
    var hclone = h.clone();
    if (num_lbl) { hclone.prepend(num_lbl); }
    hclone.children().last().remove(); // remove the last child (that is the automatic anchor)
    hclone.find("a[name]").remove(); //remove all named anchors
    a.html(hclone.html());
    a.on('click', function() {
            setTimeout(function() { $.ajax() }, 100); //workaround for  https://github.com/jupyter/notebook/issues/699
            if (liveNotebook) {
                IPython.notebook.get_selected_cell().unselect(); //unselect current cell
                var new_selected_cell = $("[id='" + h.attr('id') + "']").parents('.unselected').switchClass('unselected', 'selected')
                new_selected_cell.data('cell').selected = true;
            }
        })
    return a;
};


  var make_link_originalid = function (h, num_lbl) {
    var a = $("<a/>");
    a.attr("href", '#' + h.attr('saveid'));
    // add a data attribute so that other code (e.g. collapsible_headings) can use it
    a.attr('data-tdd-modified-id', h.attr('id'));
    // get the text *excluding* the link text, whatever it may be
    var hclone = h.clone();
    if( num_lbl ){ hclone.prepend(num_lbl); }
    hclone.children().last().remove(); // remove the last child (that is the automatic anchor)
    hclone.find("a[name]").remove();   //remove all named anchors
    a.html(hclone.html());
    a.on('click',function(){setTimeout(function(){ $.ajax()}, 100) }) //workaround for  https://github.com/jupyter/notebook/issues/699
    return a;
}

var ol_depth = function (element) {
  // get depth of nested ol
  var d = 0;
  while (element.prop("tagName").toLowerCase() == 'ol') {
    d += 1;
    element = element.parent();
  }
  return d;
};


function handle_output(out){
    console.log('in handle output: ' + out);
    console.dir(out);
    var res = null;
    // if output is a print statement
    if(out.msg_type == "stream"){
        console.log('It was a stream');
        res = out.content.text;
        console.log(res);
    }
    // if output is a python object
    else if(out.msg_type === "execute_result"){
        console.log('It was a py object');
        res = out.content.data["text/plain"];
    }
    // if output is a python error
    else if(out.msg_type == "pyerr"){
        console.log('It was an error');
        res = out.content.ename + ": " + out.content.evalue;
    }
    // if output is something we haven't thought of
    else{
        res = "[out type not implemented]";
        console.dir(out);
    }
    $("#tdd").append(res.replace(/\n/g,'<br/>'));
	resArray = res.match(/[^\r\n]+/g);
	if (resArray[resArray.length-1] == 'OK') {
		$('#tdd_button .fa').css('color', 'green');
	} else {
		$('#tdd_button .fa').css('color', 'red');
	}
}


function run_tests() {
  var IPythonKernel = IPython.notebook.metadata.kernelspec.language == "python";
  if (IPythonKernel) {
    codelines = $('.code_cell .CodeMirror').text();
	re = /class (\w+Test)/gm;
	while ((testClass = re.exec(codelines)) !== null) {
      var testclass = testClass[1];
      var test_runner = 'a = ' + testclass + '();' +
                        'suite = unittest.TestLoader().loadTestsFromModule(a);' +
                        'bob = unittest.TextTestRunner().run(suite);';
      var kernel = IPython.notebook.kernel;
      var callbacks = { 'iopub' : {'output' : handle_output}};
      var msg_id = kernel.execute(test_runner, callbacks);
	}
  } else {
    alert("Sorry; this only works with a IPython kernel");
  }
}


  // extra download as html with tdd menu (needs IPython kernel)
 function addSaveAsWithTdd() {
     var saveAsWithTdd = $('#save_html_with_tdd').length == 0
     var IPythonKernel = IPython.notebook.metadata.kernelspec.language == "python"
     if (IPythonKernel) {
         if ($('#save_html_with_tdd').length == 0) {
             $('#save_checkpoint').after("<li id='save_html_with_tdd'/>")
             $('#save_html_with_tdd').append($('<a/>').text('Save as HTML (with tdd)').attr("href", "#"))
             $('#save_html_with_tdd').click(function() {
                 var IPythonKernel = IPython.notebook.metadata.kernelspec.language == "python"
                 if (IPythonKernel) {
                     var code = "!jupyter nbconvert '" + IPython.notebook.notebook_name + "' --template tdd"
                     console.log(code)
                     IPython.notebook.kernel.execute(code)
                 } else {
                     alert("Sorry; this only works with a IPython kernel");
                     $('#save_html_with_tdd').remove();
                 }
             })
         }
     } else {
         if ($('#save_html_with_tdd').length > 0) $('#save_html_with_tdd').remove()
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
        if ((ui.position.left<=0) && (cfg.sideBar==false)){
          cfg.sideBar = true;
          st.oldTddHeight = $('#tdd-wrapper').css('height');
          if(liveNotebook){
            IPython.notebook.metadata.tdd['sideBar']=true;
            IPython.notebook.set_dirty();}
          //$('#tdd-wrapper').css('height','');
          tdd_wrapper.removeClass('float-wrapper').addClass('sidebar-wrapper');
          $('#notebook-container').css('margin-right',$('#tdd-wrapper').width()+30);
          $('#notebook-container').css('width',$('#notebook').width()-$('#tdd-wrapper').width()-30);
          ui.position.top = liveNotebook ? $('#header').height() : 0;
          ui.position.left = 0;
          if(liveNotebook){
            $('#tdd-wrapper').css('height',$('#site').height());}
          else{
          $('#tdd-wrapper').css('height','96%');}
          $('#tdd').css('height', $('#tdd-wrapper').height()-$('#tdd-header').height());
        }
        if (ui.position.left<=0) {
          ui.position.left = 0;
          ui.position.top = liveNotebook ? $('#header').height() : 0;
        }
        if ((ui.position.left>0) && (cfg.sideBar==true)) {
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
             $('#notebook-container').css('margin-left',$('#tdd-wrapper').width()+30)
             $('#notebook-container').css('width',$('#notebook').width()-$('#tdd-wrapper').width()-30)
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
        if (IPython.notebook.metadata.tdd['tdd_window_display']!==undefined)    {
            console.log("******Restoring tdd display");
            $('#tdd-wrapper').css('display',IPython.notebook.metadata.tdd['tdd_window_display'] ? 'block' : 'none');
            //$('#tdd').css('overflow','auto')
        }
      }
    }

    // if tdd-wrapper is undefined (first run(?), then hide it)
    if ($('#tdd-wrapper').css('display')==undefined) $('#tdd-wrapper').css('display',"none") //block
  //};

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

//------------------------------------------------------------------
   // TDD CELL -- if cfg.tdd_cell=true, add and update a tdd cell in the notebook.
   //             This cell, initially at the very beginning, can be moved.
   //             Its contents are automatically updated.
   //             Optionnaly, the sections in the tdd can be numbered.


   function look_for_cell_tdd(callb){ // look for a possible tdd cell
       var cells = IPython.notebook.get_cells();
       var lcells=cells.length;
       for (var i = 0; i < lcells; i++) {
          if (cells[i].metadata.tdd=="true") {
                cell_tdd=cells[i];
                tdd_index=i;
                //console.log("Found a cell_tdd",i);
                break;}
                }
    callb && callb(i);
    }
    // then process the tdd cell:

    function process_cell_tdd(cfg,st){
        // look for a possible tdd cell
         var cells = IPython.notebook.get_cells();
         var lcells=cells.length;
         for (var i = 0; i < lcells; i++) {
            if (cells[i].metadata.tdd=="true") {
                  st.cell_tdd=cells[i];
                  st.tdd_index=i;
                  //console.log("Found a cell_tdd",i);
                  break;}
                  }
        //if tdd_cell=true, we want a cell_tdd.
        //  If it does not exist, create it at the beginning of the notebook
        //if tdd_cell=false, we do not want a cell-tdd.
        //  If one exists, delete it
        if(cfg.tdd_cell) {
               if (st.cell_tdd == undefined) {
                    st.rendering_tdd_cell = true;
                    //console.log("*********  Tdd undefined - Inserting tdd_cell");
                    st.cell_tdd = IPython.notebook.select(0).insert_cell_above("markdown");
                    st.cell_tdd.metadata.tdd="true";
               }
        }
        else{
           if (st.cell_tdd !== undefined) IPython.notebook.delete_cell(st.tdd_index);
           st.rendering_tdd_cell=false;
         }
    } //end function process_cell_tdd --------------------------

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
    //process_cell_tdd();

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

//var out=$.ajax({url:"/nbextensions/tdd/tdd.js", async:false})
//eval(out.responseText)
