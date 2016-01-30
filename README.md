# snyk/module


[![Build Status](https://travis-ci.org/Snyk/module.svg?branch=master)](https://travis-ci.org/Snyk/module) [![Coverage Status](https://coveralls.io/repos/Snyk/module/badge.svg?branch=master&service=github)](https://coveralls.io/github/Snyk/module?branch=develop)

Parses a string module name into an object, and tests for Snyk support.

See [tests](https://github.com/Snyk/module/blob/4a1055822a33b4294bd28e3502135e1153c06a46/test/index.test.js) for examples.

Note that at this time the following are not supported in Snyk:

- Private npm modules
- External modules, i.e. those loaded over http or git
