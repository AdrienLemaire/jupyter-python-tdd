# jupyter-python-tdd

![maintained](https://img.shields.io/maintenance/yes/2017.svg)
[![GitHub tag](https://img.shields.io/github/tag/Fandekasp/jupyter-python-tdd.svg?maxAge=3600&label=Github)](https://github.com/Fandekasp/jupyter-python-tdd)

Nbextension to run Python unittests in a TDD fashion directly from the notebook


## Install

    $ git clone https://github.com/Fandekasp/jupyter-python-tdd.git
    $ cd jupyter-python-tdd/
    $ jupyter nbextension install tdd --user
    $ jupyter nbextension enable tdd/main --user


## Features

* Auto-discovers all classes which name end with **Test**. Eg `class MyTest(unittest.TestCase):`

* Runs all the tests everytime a CodeCell is executed.
* Displays unittest results in the TDD placeholder.
* Placeholder is pannable on the right side of the screen, and draggable elsewhere.
* The TDD button available in the top menu is shown as a checkbox icon.
* The TDD button and the placeholder title are colorized green or red depending on the test results.


## To Do
- [ ] Fix bug unittest not loaded at start
- [ ] Auto-run tests on code modification (not only on code execution)
- [ ] Write tests to cover the project (yeah, I know...)
- [ ] Make extension work regardless of the state of the following extensions: toc2, execute_time
- [ ] Hide TDD button when no test class has been detected in the notebook
- [ ] Integrate Flake8 to respect PEP8 recommendations.
- [ ] Show code coverage to cover 80%+ of the code.
- [ ] Support Python 2 and Python 3 kernels (only Python3 tested atm)
- [ ] Adapt and upload extension to [PyPI](https://pypi.python.org/pypi) and [AUR](https://aur.archlinux.org/).
- [ ] Adapt and submit extension to [jupyter_contrib_nbextensions](https://github.com/ipython-contrib/jupyter_contrib_nbextensions)

## Contributions welcome
* Write new `HtmlTestRunner` & `HtmlTestResult` classes, to improve the html rendering.
  Write them as a new plugin to submit to unittest and/or py.test projects.
* Auto-move tests in the TDD placeholder to have them separated from the actual code. Might be good to get inspired by the
  [scratchpad extension](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions/scratchpad).
* Support other test runners (only unittest atm). I tried to look up at nose and
  py.test test runners, but it appears more difficult to implement than I expected.
* Support other kernels (only IPython atm).


## Credits

The [toc2 nbextension](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions/toc2)
has been used as model to build this extension, especially the logic to make the placeholder draggable & pannable.
