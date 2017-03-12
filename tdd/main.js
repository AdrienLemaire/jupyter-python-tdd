define(function(){
  return {
    // this will be called at extension loading time
    //---
    load_ipython_extension: function(){
        console.log("I have been loaded ! -- my nb extension");

        // Get all code cells
        cells = $('.cell.code_cell .inner_cell .CodeMirror-code');
        current_state = cells.text();

        // Start infinite loop.
        // Execute test runner cell when state changes
        //Jupyter.notebook.execute_cells([2])
        //Instead of adding test runner in a cell and executing it by id, let's exec python from js directly
        //https://gist.github.com/sanbor/e9c8b57c5759d1ff382a
		function handle_output(out){
		    console.log(out);
		    var res = null;
		 	// if output is a print statement
		    if(out.msg_type == "stream"){
				console.log('It was a stream');
		 	    res = out.content.data;
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
		    }
		    document.getElementById("result_output").value = res;
		}

        // 1. Find all test class names in current_state
        // 2. Exec testrunner with class names
        // 3. Handle output and display somewhere
        var testclass = 'MyTest';
        var test_runner = 'a = ' + testclass + '()'\
                          'suite = unittest.TestLoader().loadTestsFromModule(a)'\
                          'unittest.TextTestRunner().run(suite)';
        var kernel = IPython.notebook.kernel;
        var callbacks = { 'iopub' : {'output' : handle_output}};
        var msg_id = kernel.execute(code_input, callbacks, {silent:false});
    }
    //---
  };
})
