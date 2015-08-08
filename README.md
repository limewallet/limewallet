Limewallet
=========

BitShares bitAssets mobile wallet.

## Installation
- npm install -g cordova ionic
- git clone https://github.com/limewallet/limewallet
- cd limewallet
- ./init_android.sh (or ./init_android.sh)

### Post init setup (Android)
#### Edit platforms/android/AndroidManifest.xml
##### Add these two lines just after the existing bts `<intent-filter>`

```xml
<intent-filter>
    <data android:scheme="bitcoin" />
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
</intent-filter>
```

### Post init setup (iOS)
After init iOS platform, open XCode project located at `bitwallet/platforms/ios/Bitwallet.xcodeproj`.
Add `"$(SRCROOT)/../../plugins/com.latincoin.BitsharesPlugin/src/ios/includes"` to `Build Settings` (Combined view mode) -> `Header Search Paths`

Change `Bundle Identifier` at your convenience if you are about to run the app in a device.

#### Build app
ionic build android (or ionic build ios)

#### Run app
ionic run android (or ionic run ios)
