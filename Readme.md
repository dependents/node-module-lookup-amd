### module-lookup-amd

Gives you the real path of (possibly) aliased modules. Otherwise, gives you back the same dependency name if it's not aliased.

`npm install module-lookup-amd`

### Usage

```js

var lookup = require('module-lookup-amd');

var realPath = lookup('path/to/my/config.js', 'dependency/path', 'path/to/file/containing/dependency');
```

### `lookup(configPath, dependencyPath, filepath)`

* `configPath`: the path to your RequireJS configuration file
* `dependencyPath`: the (potentially aliased) dependency that you want to lookup
* `filepath`: the filepath of the file that contains the dependency (i.e., parent module)

### Shell usage

*Assumes a global `-g` installation*

`lookup-amd -c path/to/my/config.js -f path/to/file/containing/dependency my/dependency/name`
