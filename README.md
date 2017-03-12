# jupyter-python-tdd
Nbextension to run Python unittests in a TDD fashion directly from the notebook


## Testing the extension

### Successful procedure

    $ jupyter nbextension install tdd --user
    $ jupyter nbextension enable tdd/main --user


### Failed procedure
Open a notebook, and execute the following code:

    import notebook.nbextensions

    notebook.nbextensions.install_nbextension('https://rawgithub.com/Fandekasp/jupyter-python-tdd/master/nbextension/tdd.js', user=True)
in a new cell, run:

    %%javascript
    Jupyter.utils.load_extensions('tdd')


## Plan for building the extension


### Goal
* Run unittests in real time to notify user when a test break during a code modification.
* Show coverage
* Show visual similar to toc2 extension
    * panel on the side to display coverage and test results on the fly
    * top button to hide/show panel. Top button can be colorized to notify user


### Thoughts

Do:
* Need to run a test runner behind. Investigate how to communicate with test runner from extension
* Test runner should trigger itself automatically with watchdog on the notebook
* Notebook should be converted on the fly to .py file in order for the test runner to work
* Rename repo into jupyter-tdd, and handle test runner per kernel


Don't do:

* Attaching unittests to cells might not be a good idea (test might break due to dependency in other cell)
* Not a good idea to have a different cell type for unittests. It's still code after all, and we can use the codefolding extension to hide tests

