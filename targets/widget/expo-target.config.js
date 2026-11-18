/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'Araç Takvimi',
  // Uygulama ile widget aynı App Group üzerinden veri paylaşır.
  entitlements: {
    'com.apple.security.application-groups': ['group.com.aractakvimi.app'],
  },
  colors: {
    $accent: '#2563EB',
    $widgetBackground: '#FFFFFF',
  },
  deploymentTarget: '17.0',
});
