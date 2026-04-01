// OneSignal Service Worker
try {
    self.importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');
} catch (e) {
    console.log('OneSignal worker load warning:', e);
}
