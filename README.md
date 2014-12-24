BitWallet
=========

BitShares bitAssets mobile wallet.

## Installation
npm install -g cordova@3.5 ionic
git clone https://github.com/latincoin-com/bitwallet
cd bitwallet
git checkout dargon-dev-ios
./init_ios.h

### Requirements
After init iOS platform, open XCode project located at `bitwallet/platforms/ios/Bitwallet.xcodeproj`.
Add `"$(SRCROOT)/../../plugins/com.latincoin.BitsharesPlugin/src/ios/includes"` to `Build Settings` (Combined view mode) -> `Header Search Paths`

Change `Bundle Identifier` at your convenience if you are about to run the app in a device.
You can email your iPhone/iPod UUID to `pablo@latincoin.com` and get a link to download and install the app for testing purposes.
