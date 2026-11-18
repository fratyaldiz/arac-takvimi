const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo, dikey yönlendirme ayarı yüzünden manifest'e
 * `android.hardware.screen.portrait` özelliğini zorunlu olarak ekliyor.
 * Play Console bunu "kullanılabilirliği kısıtlıyor" diye işaretliyor:
 * ChromeOS ve Android XR cihazları uygulamayı göremiyor. Uygulama dikey
 * çalışıyor ama bu bir donanım şartı değil; required=false yapılır.
 */
const FEATURE = 'android.hardware.screen.portrait';

module.exports = function withPortraitNotRequired(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest['uses-feature'] = manifest['uses-feature'] ?? [];

    const existing = manifest['uses-feature'].find((f) => f.$?.['android:name'] === FEATURE);
    if (existing) existing.$['android:required'] = 'false';
    else manifest['uses-feature'].push({ $: { 'android:name': FEATURE, 'android:required': 'false' } });

    return mod;
  });
};
