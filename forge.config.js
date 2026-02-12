const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    // Logic: This is the name of the .exe or binary file
    executableName: "digital-clinic", 
    // Logic: Path to your icon (no extension needed here, Forge picks the right one)
    // icon: './public/icon' 
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel', // Windows
      config: {
        name: "digital_clinic"
      },
    },
    {
      name: '@electron-forge/maker-zip', // macOS
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb', // Linux (Ubuntu/Debian)
      config: {
        options: {
          maintainer: 'Clinic Admin',
          homepage: 'https://your-clinic-url.com',
          // Logic: Specific icon for the Linux installer
          // icon: './public/icon.png', 
          categories: ['Utility', 'Office']
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm', // Linux (Fedora/RedHat)
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};