const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip notarization if credentials are not available
  if (!process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.APPLE_TEAM_ID) {
    console.log('Skipping notarization: Apple credentials not provided (APPLEID, APPLEIDPASS, APPLE_TEAM_ID)');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.hardwario.playground',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
