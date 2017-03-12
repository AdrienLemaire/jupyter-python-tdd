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
                var cell = new_selected_cell.data('cell') // IPython.notebook.get_selected_cell()
                highlight_tdd_item("tdd_link_click", {cell: cell})
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


 function highlight_tdd_item(evt, data) {
     var c = data.cell.element; //
     if (c) {
         var ll = $(c).find(':header')
         if (ll.length == 0) {
             var ll = $(c).prevAll().find(':header')
         }
         var elt = ll[ll.length - 1]
         if (elt) {
             var highlighted_item = $(tdd).find('a[href="#' + elt.id + '"]')
             if (evt.type == "execute") {
                 // remove the selected class and add execute class
                 // il the cell is selected again, it will be highligted as selected+running
                 highlighted_item.removeClass('tdd-item-highlight-select').addClass('tdd-item-highlight-execute')
                     //console.log("->>> highlighted_item class",highlighted_item.attr('class'))
             } else {
                 $(tdd).find('.tdd-item-highlight-select').removeClass('tdd-item-highlight-select')
                 highlighted_item.addClass('tdd-item-highlight-select')
             }
         }
     }
 }


  // extra download as html with tdd menu (needs IPython kernel)
 function addSaveAsWithToc() {
     var saveAsWithToc = $('#save_html_with_tdd').length == 0
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
      .text("Contents ")
      .append(
        $("<a/>")
        .attr("href", "#")
        .addClass("hide-btn")
        .attr('title', 'Hide ToC')
        .text("[-]")
        .click( function(){
            $('#tdd').slideToggle({'complete': function(){ if(liveNotebook){
            IPython.notebook.metadata.tdd['tdd_section_display']=$('#tdd').css('display');
            IPython.notebook.set_dirty();}}
              });
            $('#tdd-wrapper').toggleClass('closed');
            if ($('#tdd-wrapper').hasClass('closed')){
              st.oldTocHeight = $('#tdd-wrapper').css('height'); 
              $('#tdd-wrapper').css({height: 40});
              $('#tdd-wrapper .hide-btn')
              .text('[+]')
              .attr('title', 'Show ToC');
            } else {
             // $('#tdd-wrapper').css({height: IPython.notebook.metadata.tdd.tdd_position['height']});
             // $('#tdd').css({height: IPython.notebook.metadata.tdd.tdd_position['height']});
              $('#tdd-wrapper').css({height: st.oldTocHeight});
              $('#tdd').css({height: st.oldTocHeight});
              $('#tdd-wrapper .hide-btn')
              .text('[-]')
              .attr('title', 'Hide ToC');
            }
            return false;
          })
      ).append(
        $("<a/>")
        .attr("href", "#")
        .addClass("reload-btn")
        .text("  \u21BB")
        .attr('title', 'Reload ToC')
        .click( function(){
          table_of_contents(cfg,st);
          return false;
        })
      ).append(
        $("<span/>")
        .html("&nbsp;&nbsp")
      ).append(
        $("<a/>")
        .attr("href", "#")
        .addClass("number_sections-btn")
        .text("n")
        .attr('title', 'Number text sections')
        .click( function(){
          cfg.number_sections=!(cfg.number_sections); 
          if(liveNotebook){
            IPython.notebook.metadata.tdd['number_sections']=cfg.number_sections;
        
            IPython.notebook.set_dirty();}
          //$('.tdd-item-num').toggle();  
          cfg.number_sections ? $('.tdd-item-num').show() : $('.tdd-item-num').hide()
          //table_of_contents();
          return false;
        })
      ).append(
        $("<span/>")
        .html("&nbsp;&nbsp;")
        ).append(
        $("<a/>")
        .attr("href", "#")
        .addClass("tdd_cell_sections-btn")
        .html("t")
        .attr('title', 'Add a tdd section in Notebook')
        .click( function(){
          cfg.tdd_cell=!(cfg.tdd_cell); 
          if(liveNotebook){
            IPython.notebook.metadata.tdd['tdd_cell']=cfg.tdd_cell;
            IPython.notebook.set_dirty();}
          table_of_contents(cfg,st);
          return false;
        })
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
          st.oldTocHeight = $('#tdd-wrapper').css('height');
          if(liveNotebook){
            IPython.notebook.metadata.tdd['sideBar']=true;
            IPython.notebook.set_dirty();}
          //$('#tdd-wrapper').css('height','');
          tdd_wrapper.removeClass('float-wrapper').addClass('sidebar-wrapper');
          $('#notebook-container').css('margin-left',$('#tdd-wrapper').width()+30);
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
          if (st.oldTocHeight==undefined) st.oldTocHeight=Math.max($('#site').height()/2,200)
          $('#tdd-wrapper').css('height',st.oldTocHeight);        
          tdd_wrapper.removeClass('sidebar-wrapper').addClass('float-wrapper');
          $('#notebook-container').css('margin-left',30);
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
              .attr('title', 'Show ToC');         
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
            $('#notebook-container').css('margin-left', '212px');
            $('#tdd-wrapper').css('height', '96%');
            $('#tdd').css('height', $('#tdd-wrapper').height() - $('#tdd-header').height())
        } else {
            if (cfg.tdd_window_display) {
              setTimeout(function() {
                $('#notebook-container').css('width', $('#notebook').width() - $('#tdd-wrapper').width() - 30);
                $('#notebook-container').css('margin-left', $('#tdd-wrapper').width() + 30);
                 }, 500)
            }
            setTimeout(function() {
                $('#tdd-wrapper').css('height', $('#site').height());
                $('#tdd').css('height', $('#tdd-wrapper').height() - $('#tdd-header').height())
            }, 500)
        }
        setTimeout(function() { $('#tdd-wrapper').css('top', liveNotebook ? $('#header').height() : 0); }, 500) //wait a bit
        $('#tdd-wrapper').css('left', 0);

    }

    else {
      tdd_wrapper.addClass('float-wrapper');   
    }
}

//------------------------------------------------------------------
   // TOC CELL -- if cfg.tdd_cell=true, add and update a tdd cell in the notebook. 
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
                    //console.log("*********  Toc undefined - Inserting tdd_cell");
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
var table_of_contents = function (cfg,st) {

    if(st.rendering_tdd_cell) { // if tdd_cell is rendering, do not call  table_of_contents,                             
        st.rendering_tdd_cell=false;  // otherwise it will loop
        return}
  

    var tdd_wrapper = $("#tdd-wrapper");
   // var tdd_index=0;
    if (tdd_wrapper.length === 0) {
      create_tdd_div(cfg,st);
    }
    var segments = [];
    var ul = $("<ul/>").addClass("tdd-item").attr('id','tdd-level0');
   
     // update tdd element
     $("#tdd").empty().append(ul);


    st.cell_tdd = undefined;
   // if cfg.tdd_cell=true, add and update a tdd cell in the notebook. 

    if(liveNotebook){
      ///look_for_cell_tdd(process_cell_tdd);        
      process_cell_tdd(cfg,st);
    }
    //process_cell_tdd();
    
    var cell_tdd_text = "# Test Runner\n <p>";
    var depth = 1; //var depth = ol_depth(ol);
    var li= ul;//yes, initialize li with ul! 
    var all_headers= $("#notebook").find(":header");
    var min_lvl=1, lbl_ary= [];
    for(; min_lvl <= 6; min_lvl++){ if(all_headers.is('h'+min_lvl)){break;} }
    for(var i= min_lvl; i <= 6; i++){ lbl_ary[i - min_lvl]= 0; }

    //loop over all headers
    all_headers.each(function (i, h) {
      var level = parseInt(h.tagName.slice(1), 10) - min_lvl + 1;
      // skip below threshold
      if (level > cfg.threshold){ return; }
      // skip headings with no ID to link to
      if (!h.id){ return; }
      // skip tdd cell if present
      if (h.id=="Table-of-Contents"){ return; }
      //If h had already a number, remove it
      $(h).find(".tdd-item-num").remove();
      var num_str= incr_lbl(lbl_ary,level-1).join('.');// numbered heading labels
      var num_lbl= $("<span/>").addClass("tdd-item-num")
            .text(num_str).append('&nbsp;').append('&nbsp;');

      // walk down levels
      for(var elm=li; depth < level; depth++) {
          var new_ul = $("<ul/>").addClass("tdd-item");
          elm.append(new_ul);
          elm= ul= new_ul;
      }
      // walk up levels
      for(; depth > level; depth--) {
          // up twice: the enclosing <ol> and <li> it was inserted in
          ul= ul.parent();
          while(!ul.is('ul')){ ul= ul.parent(); }
      }
      // Change link id -- append current num_str so as to get a kind of unique anchor 
      // A drawback of this approach is that anchors are subject to change and thus external links can fail if tdd changes
      // Anyway, one can always add a <a name="myanchor"></a> in the heading and refer to that anchor, eg [link](#myanchor) 
      // This anchor is automatically removed when building tdd links. The original id is also preserved and an anchor is created 
      // using it. 
      // Finally a heading line can be linked to by [link](#initialID), or [link](#initialID-num_str) or [link](#myanchor)
        if (!$(h).attr("saveid")) {$(h).attr("saveid", h.id)} //save original id
        h.id=$(h).attr("saveid")+'-'+num_str.replace(/\./g,'');  
        // change the id to be "unique" and tdd links to it 
        // (and replace '.' with '' in num_str since it poses some pb with jquery)
        var saveid = $(h).attr('saveid')
        //escape special chars: http://stackoverflow.com/questions/3115150/
        var saveid_search=saveid.replace(/[-[\]{}():\/!;&@=$£%§<>%"'*+?.,~\\^$|#\s]/g, "\\$&"); 
        if ($(h).find("a[name="+saveid_search+"]").length==0){  //add an anchor with original id (if it doesnt't already exists)
             $(h).prepend($("<a/>").attr("name",saveid)); }

  
      // Create tdd entry, append <li> tag to the current <ol>. Prepend numbered-labels to headings.
      li=$("<li/>").append( make_link( $(h), num_lbl));

      ul.append(li);
      $(h).prepend(num_lbl);
      

      //tdd_cell:
      if(cfg.tdd_cell) {
          var leves = '<div class="lev' + level.toString() + ' tdd-item">';
          var lnk=make_link_originalid($(h))
          cell_tdd_text += leves + $('<p>').append(lnk).html()+'</div>';
          //workaround for https://github.com/jupyter/notebook/issues/699 as suggested by @jhamrick
          lnk.on('click',function(){setTimeout(function(){$.ajax()}, 100) }) 
      }
    });

 

     // update navigation menu
     if (cfg.navigate_menu) {
         var pop_nav = function() { //callback for create_nav_menu
             //$('#Navigate_menu').empty().append($("<div/>").attr("id", "navigate_menu").addClass('tdd').append(ul.clone().attr('id', 'navigate_menu-level0')))
             $('#navigate_menu').empty().append($('#tdd-level0').clone().attr('id', 'navigate_menu-level0'))
         }
         if ($('#Navigate_menu').length == 0) {
             create_navigate_menu(pop_nav);
         } else {
             pop_nav()                 
         }
     } else { // If navigate_menu is false but the menu already exists, then remove it
         if ($('#Navigate_menu').length > 0) $('#Navigate_sub').remove()
     }
    


    if(cfg.tdd_cell) {
         st.rendering_tdd_cell = true;
         //IPython.notebook.to_markdown(tdd_index);
         st.cell_tdd.set_text(cell_tdd_text); 
         st.cell_tdd.render();
    };

    // Show section numbers if enabled
    cfg.number_sections ? $('.tdd-item-num').show() : $('.tdd-item-num').hide()

    $(window).resize(function(){
        $('#tdd').css({maxHeight: $(window).height() - 30});
        $('#tdd-wrapper').css({maxHeight: $(window).height() - 10});

        if (cfg.sideBar==true) {
          if ($('#tdd-wrapper').css('display')!='block'){
          $('#notebook-container').css('margin-left',30);
          $('#notebook-container').css('width',$('#notebook').width()-30);  
          }  
          else{
          $('#notebook-container').css('margin-left',$('#tdd-wrapper').width()+30);
          $('#notebook-container').css('width',$('#notebook').width()-$('#tdd-wrapper').width()-30);
          $('#tdd-wrapper').css('height',liveNotebook ? $('#site').height(): $(window).height() - 10);
          $('#tdd-wrapper').css('top', liveNotebook ? $('#header').height() : 0);  
          }
        } else{
          $('#notebook-container').css('margin-left',30);
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
          $('#notebook-container').css('margin-left',st.nbcontainer_marginleft);
          $('#notebook-container').css('width',st.nbcontainer_width);  
          }  
          else{
          $('#notebook-container').css('margin-left',$('#tdd-wrapper').width()+30)
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
      table_of_contents(cfg,st);
      }
    });
  
  };

//var out=$.ajax({url:"/nbextensions/tdd/tdd.js", async:false})
//eval(out.responseText)
