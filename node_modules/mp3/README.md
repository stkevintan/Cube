MP3.js - a JavaScript MP3 for Aurora.js
================================================

MP3.js is a refactored version of [JSMad](https://github.com/ofmlabs/jsmad) designed to run in the 
[Aurora.js](https://github.com/audiocogs/aurora.js) audio framework.  It supports all of the
features of JSMad and is released under the same GPLv2 license.  The code was reorganized a bit, and now
uses all typed arrays for decoding at better performance.

MP3.js adds support for layer I and II to the existing support for layer III. It also supports free bitrate streams, 
and improves performance thanks to the use of typed arrays.

## Demo

You can check out a [demo](http://audiocogs.org/codecs/mp3/) alongside our other decoders 
[alac.js](http://github.com/audiocogs/alac.js), [flac.js](http://github.com/devongovett/flac.js), and [AAC.js](http://github.com/audiocogs/aac.js).  Currently MP3.js
works properly in the latest versions of Firefox, Chrome, and Safari.

## Authors

JSMad was originally written by [@nddrylliog](https://twitter.com/nddrylliog), 
[@jensnockert](https://twitter.com/jensnockert), and [@mgeorgi](https://twitter.com/mgeorgi) during a Music Hack Day. The 
refactor for MP3.js was performed by [@devongovett](https://twitter.com/devongovett).

## Building
    
We use [browserify](https://github.com/substack/node-browserify) to build MP3.js.  You can download a
prebuilt version from the Github [releases](https://github.com/audiocogs/mp3.js/releases) page. 
To build MP3.js for the browser yourself, use the following commands:

    npm install
    make browser
    
This will place a built `mp3.js` file, as well as a source map in the `build/` directory.

MP3.js depends on [Aurora.js](https://github.com/audiocogs/aurora.js), our audio codec framework.
For detailed information on how to use Aurora.js, check out the [documentation](https://github.com/audiocogs/aurora.js/wiki).
## License

MP3.js follows the same jsmad license. MP3.js is available under the terms of the GNU General Public License, 
Version 2. Please note that under the GPL, there is absolutely no warranty of any kind, to the extent permitted by the law.

## Future

- MPEG 2.5 is not supported.
- Most of ID3v2.2 and ID3v2.3 are implemented, but some tags are missing.
