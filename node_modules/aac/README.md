AAC.js: A JavaScript AAC Decoder
================================

Advanced Audio Coding (AAC) is a standardized, high quality lossy audio codec, designed as the successor to the MP3 format.  AAC is now
one of the most widely deployed audio codecs, and such names as the iTunes Store distribute music in the AAC format.

AAC can be played in a limited number of browsers using the HTML5 audio element, however, some browsers do not support the codec 
for various reasons.  AAC.js enables playback and other decoding tasks in all browsers using the 
[Aurora.js](https://github.com/audiocogs/aurora.js) audio framework.

AAC.js is based on the prior work of many open source projects, including [JAAD](http://jaadec.sourceforge.net), 
[FAAD](http://www.audiocoding.com/faad2.html), [FFMpeg](http://ffmpeg.org/), and [Helix Datatype](https://datatype.helixcommunity.org).

## Demo

You can check out a [demo](http://audiocogs.org/codecs/aac/) alongside our other decoders [MP3.js](http://github.com/devongovett/mp3.js), [flac.js](http://github.com/audiocogs/flac.js), and [alac.js](http://github.com/audiocogs/alac.js).  Currently, AAC.js works properly in the latest versions of Firefox, Chrome, and Safari.

## Authors

AAC.js was written by [@devongovett](http://github.com/devongovett) of [Audiocogs](http://audiocogs.org/).

## Building

We use [browserify](https://github.com/substack/node-browserify) to build AAC.js.  You can download a
prebuilt version from the Github [releases](https://github.com/audiocogs/aac.js/releases) page. 
To build AAC.js for the browser yourself, use the following commands:

    npm install
    make browser
    
This will place a built `aac.js` file, as well as a source map in the `build/` directory.

AAC.js depends on [Aurora.js](https://github.com/audiocogs/aurora.js), our audio codec framework.
For detailed information on how to use Aurora.js, check out the [documentation](https://github.com/audiocogs/aurora.js/wiki).

## Features

AAC.js supports the AAC Low Complexity Profile, which is the most common profile.  Support for the Main, High Efficiency 
(Spectral Band Replication) and High Efficiency v2 (Spectral Band Replication + Parametric Stereo) profiles is planned.
Other profiles, such as the low delay, and error resilient profiles are not supported, but we'd love pull requests if 
you feel motivated to implement them! :)

## License

AAC.js is licensed under the LGPL.

    AAC.js is free software; you can redistribute it and/or modify it 
    under the terms of the GNU Lesser General Public License as 
    published by the Free Software Foundation; either version 3 of the 
    License, or (at your option) any later version.
    
    AAC.js is distributed in the hope that it will be useful, but WITHOUT 
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
    or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General 
    Public License for more details.