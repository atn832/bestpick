bestpick
========

A cross platform application to pick the best pictures in your albums

Requirements
============
1.  Install Node.js
2.  Install Grunt globally: `npm install -g grunt-cli`
3.  Install Bower globally: `npm install -g bower`
4.  From phone/www, run `bower install` and `npm install`. This will install the project's Javascript dependencies
5.  Install [NW.js](https://nwjs.io/)

How to test on PC
=================
1.  From the `phone/www` folder, run `~/Downloads/nwjs-sdk-v0.27.3-osx-x64/nwjs.app/Contents/MacOS/nwjs .` (Mac)

How to build for PC or Mac
==========================
1.  See http://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#package-option-2-zip-file

How to test on Android
======================
1.  Install PhoneGap: http://phonegap.com/install/
2.  From the folder phone, run `phonegap run android`

If you get the following error "Error: ENOENT, no such file or directory 'platforms/android/assets'", create an empty folder called platforms and try again.
