StartupCommunity.org 
====================

Production: [![Circle CI](https://circleci.com/gh/jgentes/startupcommunity/tree/master.svg?style=svg&circle-token=c570d1083fad4150fd608147bc0fb5412d14d6f0)](https://circleci.com/gh/jgentes/startupcommunity/tree/master)

Dev: [![Circle CI](https://circleci.com/gh/jgentes/startupcommunity/tree/dev.svg?style=svg&circle-token=c570d1083fad4150fd608147bc0fb5412d14d6f0)](https://circleci.com/gh/jgentes/startupcommunity/tree/dev)

For Local:
 
 Set NODE_ENV = local
 
 Run C:\Dev\memcached\memcache.bat prior to launch, which includes:
 
* taskkill /FI "WINDOWTITLE EQ memcache" /f /t

* timeout /t 2

* start "memcache" /min memcached.exe -vv