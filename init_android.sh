rm -rf platforms/android
rm -rf plugins/*
cordova platform add android@3.5 --usenpm
cordova plugin add org.apache.cordova.console
cordova plugin add org.apache.cordova.device
cordova plugin add https://github.com/driftyco/ionic-plugins-keyboard.git
cordova plugin add https://github.com/brodysoft/Cordova-SQLitePlugin.git
cordova plugin add https://github.com/latincoin-com/BarcodeScanner.git
cordova plugin add https://github.com/VersoSolutions/CordovaClipboard
cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git
cordova plugin add org.apache.cordova.splashscreen
cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
cordova plugin add org.apache.cordova.globalization
cordova plugin add https://github.com/latincoin-com/cordova-plugin-bitwallet.git
cp resources/android/res/drawable/icon.png platforms/android/res/drawable/
cp resources/android/res/drawable-hdpi/icon.png platforms/android/res/drawable-hdpi/
cp resources/android/res/drawable-land-hdpi/screen.png platforms/android/res/drawable-land-hdpi/
cp resources/android/res/drawable-land-ldpi/screen.png platforms/android/res/drawable-land-ldpi/
cp resources/android/res/drawable-land-mdpi/screen.png platforms/android/res/drawable-land-mdpi/
cp resources/android/res/drawable-land-xhdpi/screen.png platforms/android/res/drawable-land-xhdpi/
cp resources/android/res/drawable-ldpi/icon.png platforms/android/res/drawable-ldpi/
cp resources/android/res/drawable-mdpi/icon.png platforms/android/res/drawable-mdpi/
cp resources/android/res/drawable-port-hdpi/screen.png platforms/android/res/drawable-port-hdpi/
cp resources/android/res/drawable-port-ldpi/screen.png platforms/android/res/drawable-port-ldpi/
cp resources/android/res/drawable-port-mdpi/screen.png platforms/android/res/drawable-port-mdpi/
cp resources/android/res/drawable-port-xhdpi/screen.png platforms/android/res/drawable-port-xhdpi/
cp resources/android/res/drawable-xhdpi/icon.png platforms/android/res/drawable-xhdpi/
cp resources/android/res/drawable-xxhdpi/icon.png platforms/android/res/drawable-xxhdpi/
