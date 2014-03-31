bestpick
========

A cross platform application to pick the best pictures in your albums

Requirements
============
1.  Install Node.js
1.  Install Grunt globally: `npm install -g grunt-cli`
2.  Install Bower globally: `npm install -g bower`
3.  From phone/www, run `bower install` and `npm install`. This will install the project's Javascript dependencies

How to test on PC
=================
1.  From the root folder, run `npm install`. This will install node webkit.
2.  run `npm start`

How to build for PC or Mac
==========================
1.  run `grunt`. The build binaries will be in webkitbuilds/releases.

How to test on Android
======================
1.  Install PhoneGap: http://phonegap.com/install/
2.  From the folder phone, run `phonegap run android`
If you get the following error "Error: ENOENT, no such file or directory 'platforms/android/assets'", create an empty folder platforms and try again.
