# MeCab on the Web!

[MeCab](http://mecab.googlecode.com/svn/trunk/mecab/doc/index.html) is a popular Japanese part-of-speech and morphological analyzer. Originally a native compiled application, you can now interact with it in your web browser at [http://fasiha.github.io/mecab-emscripten/](http://fasiha.github.io/mecab-emscripten/).

## Technical notes

This was achieved using the Emscripten Javascript cross-compiler. The original C++ source code was compiled using Clang to LLVM intermediate representation (IR), which Emscripten then compiled to the Javascript that runs in your browser. The dictionary data files (IPADIC) were generated using the native compiled application.

## Usage on the web

Much of the documentation on MeCab is in Japanese, including the [official documentation](http://mecab.googlecode.com/svn/trunk/mecab/doc/index.html) as well as [unofficial man pages](http://www.mwsoft.jp/programming/munou/mecab_command.html). There is also a [MeCab tutorial video](http://www.youtube.com/watch?v=1wqwWji4u0E) by Jeffrey Berhow that may be of help (though it is mainly concerned with installing MeCab in Windows). I am *not* an expert on using MeCab: the instructions accompanying the [online MeCab interface](http://fasiha.github.io/mecab-emscripten/) exhaust my knowledge. I will gratefully accept any and all contributions of a tutorial nature explaining how to use this tool.

## Building instructions

**Note!** The following instructions are *only* needed if you are a developer and want to build the Javascript sources from the C++ sources! If you just want to *use* MeCab to parse some Japanese text, simply go to [http://fasiha.github.io/mecab-emscripten/](http://fasiha.github.io/mecab-emscripten/), paste your text, add the MeCab configuration flags, and get the results.

MeCab on the Web was built on a fresh install of Ubuntu 14.04 TLS (inside a VirtualBox virtual machine if you must know), but has also been successfully built on Mac OS X.

### Native binary MeCab

First, if you don't already have MeCab installed as a native compiled application, build it. Download the [latest source release](https://code.google.com/p/mecab/downloads/list) (`mecab-0.996.tar.gz` as of September 2014), uncompress it, build it and install it via 
```
$ ./configure --with-charset=utf8 && make && make test && sudo make install
```

In Linux, you may need to run the following before the `mecab` executable will work:
```
$ export LD_LIBRARY_PATH="/usr/local/lib:$LD_LIBRARY_PATH"
```

### IPADIC dictionary
Next, download and build the IPADIC dictionary for your native binary MeCab. [Download](https://code.google.com/p/mecab/downloads/list) the latest source release (`mecab-ipadic-2.7.0-20070801.tar.gz` as of September 2014). Decompress it, then run the following to configure, build, and install it:
```
./configure --with-charset=utf-8 && make && sudo make install
```

You may test your installation of MeCab and the IPADIC dictionary by confirming that this command produces the following output:
```
$ echo test | mecab
test    名詞,固有名詞,組織,*,*,*,*
EOS
```

We needed to build the native MeCab because we needed it to build a dictionary, which is a required component for MeCab to be useful, and therefore an essential piece of this port to Javascript.

### mecab-emscripten

We finally come to Emscripten. Clone this repository. It contains the same files as the 0.996 release of MeCab, with some modifications needed for Emscripten.

The `configure` script overrides the `CFLAGS` and `CXXFLAGS` arguments that are passed into it, which are used to control optimization levels. Therefore lines 17991--17994 have to be commented out. The `configure` script included with this repository contains this update.

Configure and compile MeCab to LLVM intermediate representation (IR) with the following
```
$ EMCONFIGURE_JS=1 emconfigure ./configure --with-charset=utf8 CXXFLAGS="-std=c++11 -O1" CFLAGS="-O1" && emmake make
```
(The `configure` step will produce some scary-looking errors, but they are merely the bundled script doing some unusual things that Emscripten can't yet handle neatly.)

Next, rename the MeCab LLVM IR (which resides in `src/.libs`) so Emscripten knows what to do with it, and copy in the default `mecabrc` configuration and the IPADIC dictionary data files.
```
$ cd src/.libs
$ cp mecab mecab.bc
$ cp /usr/local/etc/mecabrc .
$ cp -r /usr/local/lib/mecab/dic/ipadic .
```

Finally, build the Javascript, bundling the data in a separate file for use in a web browser:
```
$ em++ -O1 mecab.bc libmecab.so -o mecab.js -s EXPORTED_FUNCTIONS="['_mecab_do2']" --preload-file mecabrc --preload-file ipadic/
```
Note that only Linux will produce `libmecab.so`; in Mac OS X, this file will be called `libmecab.dylib`, so adjust accordingly. Also note that that `mecab_do2` function was added for this project: it is a copy of the `mecab_do` function in tagger.cpp with one change that makes it easy to play with arguments coming from Javascript. tagger.cpp and mecab.h are the only two source code files from MeCab that were modified for this project.

This produces `mecab.js` and `mecab.data` files. Along with `index.html` and `index.js`, which are included in this repository, these files make up the entire MeCab on the Web project.

## Acknowledgements
MeCab is released under BSD, GPL, or LGPL licenses, and so I have chosen to license MeCab on the Web (this repository) under the most liberal of these licenses, the BSD license.

MeCab is copyrighted by Taku Kudo and NTT. The IPADIC data is copyrighted by the Nara Institute of Science and Technology, and its authors have released it under a BSD-like license (see `COPYING.ipadic`).

Emscripten is the work of Alon Zakai, of the Mozilla Foundation, and many contributors. This project also uses D3.js, by Mike Bostock, of the New York Times, and many contributors.

Many thanks to all these projects' authors.

## License
In case you missed it above, MeCab on the Web is released under the BSD license.