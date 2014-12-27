BitWallet
=========

BitShares bitAssets mobile wallet.

## Installation
- npm install -g cordova@3.5 ionic
- git clone https://github.com/latincoin-com/bitwallet
- cd bitwallet
- git checkout alpha-2
- ./init_ios.sh or ./init_android.sh

### Post init setup (iOS)
After init iOS platform, open XCode project located at `bitwallet/platforms/ios/Bitwallet.xcodeproj`.
Add `"$(SRCROOT)/../../plugins/com.latincoin.BitsharesPlugin/src/ios/includes"` to `Build Settings` (Combined view mode) -> `Header Search Paths`

Change `Bundle Identifier` at your convenience if you are about to run the app in a device.
You can email your iPhone/iPod UUID to `pablo@latincoin.com` and get a link to download and install the app for testing purposes.

### Post init setup (Android)
## Installing xwalk x86
wget https://download.01.org/crosswalk/releases/crosswalk/android/stable/8.37.189.14/x86/crosswalk-cordova-8.37.189.14-x86.zip
unzip crosswalk-cordova-8.37.189.14-x86.zip
rm -rf platforms/android/CordovaLib/*
cp -a crosswalk-cordova-8.37.189.14-x86/framework/* platforms/android/CordovaLib
cp crosswalk-cordova-8.37.189.14-x86/VERSION platforms/android

## Installing xwalk arm
wget https://download.01.org/crosswalk/releases/crosswalk/android/stable/8.37.189.14/arm/crosswalk-cordova-8.37.189.14-arm.zip
unzip crosswalk-cordova-8.37.189.14-arm.zip
cp -a crosswalk-cordova-8.37.189.14-arm/framework/xwalk_core_library/libs/armeabi-v7a platforms/android/CordovaLib/xwalk_core_library/libs/

## Edit platforms/android/AndroidManifest.xml
# Add these two lines just before the existing <application> element
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

## Build CordovaLib (xwalk version)
android update project --subprojects --path platforms/android/CordovaLib --target "android-19"
cd platforms/android/CordovaLib && ant debug && cd -

### Build app
ionic build android|ios

