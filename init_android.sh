rm -rf platforms/android
rm -rf plugins/*
cordova platform add android@4.0.0 --usenpm
cordova plugin add org.apache.cordova.console
cordova plugin add org.apache.cordova.device
cordova plugin add https://github.com/apache/cordova-plugin-whitelist.git
cordova plugin add https://github.com/driftyco/ionic-plugins-keyboard.git
cordova plugin add https://github.com/brodysoft/Cordova-SQLitePlugin.git
cordova plugin add https://github.com/latincoin-com/BarcodeScanner.git
cordova plugin add https://github.com/VersoSolutions/CordovaClipboard
cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git
cordova plugin add org.apache.cordova.splashscreen
cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
cordova plugin add org.apache.cordova.globalization
cordova plugin add https://github.com/latincoin-com/cordova-plugin-bitwallet.git
cordova plugin add https://github.com/EddyVerbruggen/LaunchMyApp-PhoneGap-Plugin.git --variable URL_SCHEME=bts
