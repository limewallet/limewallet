bitwallet
=========

bitUSD wallet
-------------

npm install -g cordova@3.5 ionic

git clone https://github.com/latincoin-com/bitwallet
cd bitwallet
git checkout alpha-1

cordova platform add android@3.5 --usenpm
./copy_res.sh

cordova plugin add org.apache.cordova.console
cordova plugin add org.apache.cordova.device
cordova plugin add https://github.com/driftyco/ionic-plugins-keyboard.git
cordova plugin add https://github.com/brodysoft/Cordova-SQLitePlugin.git
cordova plugin add https://github.com/wildabeast/BarcodeScanner.git
cordova plugin add https://github.com/VersoSolutions/CordovaClipboard
cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git
cordova plugin add org.apache.cordova.splashscreen
cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
cordova plugin add org.apache.cordova.globalization

### Installing xwalk x86
wget https://download.01.org/crosswalk/releases/crosswalk/android/stable/8.37.189.14/x86/crosswalk-cordova-8.37.189.14-x86.zip
unzip crosswalk-cordova-8.37.189.14-x86.zip
rm -rf platforms/android/CordovaLib/*
cp -a crosswalk-cordova-8.37.189.14-x86/framework/* platforms/android/CordovaLib
cp crosswalk-cordova-8.37.189.14-x86/VERSION platforms/android

### Installing xwalk arm
wget https://download.01.org/crosswalk/releases/crosswalk/android/stable/8.37.189.14/arm/crosswalk-cordova-8.37.189.14-arm.zip
unzip crosswalk-cordova-8.37.189.14-arm.zip
cp -a crosswalk-cordova-8.37.189.14-arm/framework/xwalk_core_library/libs/armeabi-v7a platforms/android/CordovaLib/xwalk_core_library/libs/

### Edit platforms/android/AndroidManifest.xml
### Add these two lines just before the existing <application> element
### <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
### <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

### Build CordovaLib (xwalk version)
android update project --subprojects --path platforms/android/CordovaLib --target "android-19"
cd platforms/android/CordovaLib
ant debug
cd -

### Build apk
export ANDROID_HOME=/path/to/android-sdk
ionic build android

### Install apk
adb install platforms/android/ant-build/Bitwallet-debug.apk
