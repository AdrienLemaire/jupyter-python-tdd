# jupyter-python-tdd
Nbextension to run Python unittests in a TDD fashion directly from the notebook


## Testing the extension

Open a notebook, and execute the following code:

    import notebook.nbextensions

    notebook.nbextensions.install_nbextension('https://rawgithub.com/Fandekasp/jupyter-python-tdd/master/tdd.js', user=True)
in a new cell, run:

    %%javascript
    Jupyter.utils.load_extensions('tdd')


## Install

    from notebook.services.config import ConfigManager
    cm = ConfigManager()
    cm.update('notebook', {"load_extensions": {"tdd": True}})
