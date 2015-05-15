alac.js: An Apple Lossless decoder in the browser
================================================================================

The Apple Lossless Audio Codec (ALAC) is an audio codec developed by Apple and included in the original iPod.
ALAC is a data compression method which reduces the size of audio files with no loss of information.
A decoded ALAC stream is bit-for-bit identical to the original uncompressed audio file.

The original encoder and decoder were [open sourced](http://alac.macosforge.org/) by Apple, 
and this is a port of the decoder to CoffeeScript so that ALAC files can be played in the browser.

## Demo

You can check out a [demo](http://audiocogs.org/codecs/alac/) alongside our other decoders [flac.js](http://github.com/audiocogs/flac.js), [MP3.js](http://github.com/devongovett/mp3.js), and [AAC.js](http://github.com/audiocogs/aac.js).  Currently, alac.js works properly in the latest versions of Firefox, Chrome, and Safari.

## Authors

alac.js was written by [@jensnockert](http://github.com/jensnockert) and [@devongovett](http://github.com/devongovett) 
of [Audiocogs](http://audiocogs.org/).

## Building

We use [browserify](https://github.com/substack/node-browserify) to build alac.js.  You can download a
prebuilt version from the Github [releases](https://github.com/audiocogs/alac.js/releases) page. 
To build alac.js for the browser yourself, use the following commands:

    npm install
    make browser
    
This will place a built `alac.js` file, as well as a source map in the `build/` directory.

alac.js depends on [Aurora.js](https://github.com/audiocogs/aurora.js), our audio codec framework.
For detailed information on how to use Aurora.js, check out the [documentation](https://github.com/audiocogs/aurora.js/wiki).

    
## License

alac.js is released under the same terms as the original ALAC decoder from Apple, which is the 
[Apache 2](http://www.apache.org/licenses/LICENSE-2.0) license.