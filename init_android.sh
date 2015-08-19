rm -rf platforms
rm -rf plugins
cordova platform add android
cordova plugin add cordova-plugin-console
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-globalization
cordova plugin add cordova-plugin-crosswalk-webview
cordova plugin add https://github.com/apache/cordova-plugin-whitelist.git
cordova plugin add https://github.com/driftyco/ionic-plugins-keyboard.git
cordova plugin add https://github.com/brodysoft/Cordova-SQLitePlugin.git
cordova plugin add https://github.com/limewallet/BarcodeScanner.git
cordova plugin add https://github.com/VersoSolutions/CordovaClipboard
cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git
cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
cordova plugin add https://github.com/limewallet/cordova-plugin-bitwallet.git
cordova plugin add https://github.com/limewallet/Custom-URL-scheme.git --variable URL_SCHEME=bts

