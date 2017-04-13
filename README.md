npm-cache
=========
this npm-cache is a fork of npm-cache from swarajban

`npm-cache` is a command line utility that caches dependencies installed via `npm`, `bower`, `jspm`, `composer` and `yarn`.

It is useful for build processes that run `[npm|bower|composer|jspm|yarn] install` every time as part of their 
build process. Since dependencies don't change often, this often means slower build times. `npm-cache`
helps alleviate this problem by caching previously installed dependencies on the build machine. 
`npm-cache` can be a drop-in replacement for any build script that runs `[npm|bower|composer|jspm|yarn] install`. 

## How it Works
When you run `npm-cache install [npm|bower|jspm|composer|yarn]`, it first looks for `package.json`, `bower.json`,
`composer.json`, `yarn.lock`, etc. in the current working directory depending on which dependency manager is requested.
It then calculates the MD5 hash of the configuration file and looks for a filed named 
<MD5 of config.json>.tar.gz in the cache directory ($HOME/.package_cache by default). If the file does not
exist, `npm-cache` uses the system's installed dependency manager to install the dependencies. Once the
dependencies are installed, `npm-cache` tars the newly downloaded dependencies and stores them in the 
cache directory. The next time `npm-cache` runs and sees the same config file, it will find the tarball
in the cache directory and untar the dependencies in the current working directory.

## Advanced features

### No archive
When storing the newly dependencies installed, npm-cache can perform a simple copy from the current project
to the cache directory instead of creating a tar.gz

### symbolic link
Used with the no archive feature, this feature provide the fastest npm install possible. When the dependencies
have already been cached, it just creates a symbolic link from the current directory to the cached dependencies.
For big project, copying all the dependencies from the cached folder, or unTARing the TARed dependencies can be 
time consuming

A reverse symbolic link can be created from the cached dependency folder to the current folder to mimic exactly
the configuration of a normal npm install

### Args flowthrough
Curtesy of Klaus Hougesen, npm-cache supports arg flowthrough and takes args into account when calculating hashes
Hash is created by globbing devdependencies, dependencies and installOptions. This can also be used to create 
environment specific hash tarballs on a build server.
For instance
`npm-cache install npm --production --bserver01`
would create a different hash tarball than
`npm-cache install npm --production --bserver02`


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
   npm-cache install    # try to install npm, bower, and composer components
   npm-cache install bower  # install only bower components
   npm-cache install bower npm  # install bower and npm components
   npm-cache install --cleanOldCachedDepsSince 3 npm  # clean cached dependency not used since 3 days and then install npm components
   npm-cache install --cacheDirectory /home/cache/ bower    # install components using /home/cache as cache directory
   npm-cache install --forceRefresh  bower  # force installing dependencies from package manager without cache
   npm-cache install --noArchive npm    # do not compress/archive the cached dependencies
   npm-cache install --useSymlink yarn # do not compress the cached dependencies, and when installing dependencies from cache, create a symlink instead of copying files
   npm-cache install npm --production -msvs_version=2013    # add args to npm installer
   npm-cache install npm --production -msvs_version=2013 bower --silent # add args to npm installer and bower
   npm-cache clean  # cleans out all cached files in cache directory
   npm-cache clean --cleanOldCachedDepsSince 3 # cleans cached files in cache directory that are older than 3 days
   npm-cache hash   # reports the current working hash
```

## Contributing
Feel free to contribute and to submit PRs @ https://github.com/Dashlane/npm-cache