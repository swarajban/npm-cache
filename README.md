npm-cache
=========

`npm-cache` is a command line utility that caches dependencies installed via `npm`, `bower`, and `composer`

## Installation
```
npm install -g npm-cache
```

## Usage
```
npm-cache install
```

```bash
Examples:
  npm-cache install                                     try to install npm, bower, and composer components
  npm-cache install bower                               install only bower components
  npm-cache install bower npm                           install bower and npm components
  npm-cache install --cachedDirectory /Users/cached/    try to install npm, bower, and composer components, using /Users/cached/ as cached directory
```



