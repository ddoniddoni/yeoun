const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const begin = '// yeoun: scene lifecycle begin';
const end = '// yeoun: scene lifecycle end';
const savedOptions = '  var yeounLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?';
const legacyStart = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

function replaceOnce(source, oldText, newText) {
  if (source.split(oldText).length !== 2) {
    throw new Error('withSceneLifecycle: Expo AppDelegate template changed; review scene startup before regenerating iOS.');
  }
  return source.replace(oldText, newText);
}

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, next => {
    const manifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'Yeoun Camera',
          UISceneClassName: 'UIWindowScene',
          UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).YeounSceneDelegate',
        }],
      },
    };
    const existing = next.modResults.UIApplicationSceneManifest;
    // @expo/plist reads dictionaries with a null prototype. Compare their
    // serializable values so an unchanged generated manifest can be reapplied.
    if (existing && !isDeepStrictEqual(JSON.parse(JSON.stringify(existing)), manifest)) {
      throw new Error('withSceneLifecycle: preserve and review the existing scene manifest before applying this single-window adapter.');
    }
    next.modResults.UIApplicationSceneManifest = manifest;
    return next;
  });

  return withAppDelegate(config, next => {
    if (next.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle requires the Expo 55 Swift AppDelegate.');
    }
    let source = next.modResults.contents;
    const scene = `${begin}\n${fs.readFileSync(path.join(__dirname, 'native/YeounSceneDelegate.swift'), 'utf8').trimEnd()}\n${end}`;
    if (source.includes(begin)) {
      const previous = source.match(/\/\/ yeoun: scene lifecycle begin[\s\S]*?\/\/ yeoun: scene lifecycle end/g);
      if (previous?.length !== 1 || !source.includes(savedOptions) || !source.includes('    yeounLaunchOptions = launchOptions')) {
        throw new Error('withSceneLifecycle: incomplete existing scene adapter; review AppDelegate.');
      }
      source = replaceOnce(source, previous[0], scene);
    } else {
      source = replaceOnce(source, '  var window: UIWindow?', `  var window: UIWindow?\n${savedOptions}`);
      source = replaceOnce(source, legacyStart, '    yeounLaunchOptions = launchOptions');
      source = `${source.trimEnd()}\n\n${scene}\n`;
    }
    next.modResults.contents = source;
    return next;
  });
};
