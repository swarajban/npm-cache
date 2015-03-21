npm-cache
=========

`npm-cache` is a command line utility that caches dependencies installed via `npm`, `bower`, and `composer`.

It is useful for build processes that run `[npm|bower|composer] install` every time as part of their 
build process. Since dependencies don't change often, this often means slower build times. `npm-cache`
helps alleviate this problem by caching previously installed dependencies on the build machine. 
`npm-cache` can be a drop-in replacement for any build script that runs `[npm|bower|composer] install`. 

## How it Works
When you run `npm-cache install [npm|bower|composer]`, it first looks for `package.json`, `bower.json`,
or `composer.json` in the current working directory depending on which dependency manager is requested.
It then calculates the MD5 hash of the configuration file and looks for a filed named 
<MD5 of config.json>.tar.gz in the cache directory ($HOME/.package_cache by default). If the file does not
exist, `npm-cache` uses the system's installed dependency manager to install the dependencies. Once the
dependencies are installed, `npm-cache` tars the newly downloaded dependencies and stores them in the 
cache directory. The next time `npm-cache` runs and sees the same config file, it will find the tarball
in the cache directory and untar the dependencies in the current working directory.


## Installation
```
npm install -g npm-cache
```

## Usage
```
npm-cache install
```

To specify arguments to each dependency manager, add the arguments after listing the dependency manager. 

For example, to install bower components with the `--allow-root` option, and composer with the `--dry-run` option:
```
npm-cache install bower --allow-root composer --dry-run
```

## Examples
```bash
npm-cache install	# try to install npm, bower, and composer components
npm-cache install bower	# install only bower components
npm-cache install bower npm	# install bower and npm components
npm-cache install bower --allow-root composer --dry-run	# install bower with allow-root, and composer with --dry-run
npm-cache --cacheDirectory /home/cache/ install bower 	# install components using /home/cache as cache directory
npm-cache --forceRefresh install bower	# force installing dependencies from package manager without cache
npm-cache clean	# cleans out all cached files in cache directory
```



[![Analytics](https://ga-beacon.appspot.com/UA-8932221-3/swarajban/npm-cache)](https://github.com/swarajban/npm-cache)