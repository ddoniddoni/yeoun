// Native source included in AppDelegate.swift by withSceneLifecycle.
// Expo 55 retains process setup; this adapter owns the single camera window.
class YeounSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private var appDelegate: AppDelegate? {
    UIApplication.shared.delegate as? AppDelegate
  }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let delegate = appDelegate,
          let factory = delegate.reactNativeFactory else {
      return
    }

    if let existingWindow = delegate.window {
      // Reconnect the same React host if UIKit reconnects our sole scene.
      existingWindow.windowScene = windowScene
      window = existingWindow
    } else {
      let cameraWindow = UIWindow(windowScene: windowScene)
      window = cameraWindow
      delegate.window = cameraWindow

      // RN reads initial links from launchOptions; UIKit now delivers them here.
      var options = delegate.yeounLaunchOptions ?? [:]
      if let context = connectionOptions.urlContexts.first {
        options[.url] = context.url
        options[.sourceApplication] = context.options.sourceApplication
        options[.annotation] = context.options.annotation
      }
      if let activity = connectionOptions.userActivities.first {
        options[.userActivityDictionary] = [
          UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
          "UIApplicationLaunchOptionsUserActivityKey": activity,
        ]
      }
      factory.startReactNative(withModuleName: "main", in: cameraWindow, launchOptions: options)
      delegate.yeounLaunchOptions = nil
    }

    window?.makeKeyAndVisible()
    // Route through Expo's subscribers as well as RN; the dev client needs this.
    self.scene(scene, openURLContexts: connectionOptions.urlContexts)
    for activity in connectionOptions.userActivities {
      self.scene(scene, continue: activity)
    }
  }

  func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
    for context in contexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [
        .openInPlace: context.options.openInPlace,
      ]
      options[.sourceApplication] = context.options.sourceApplication
      options[.annotation] = context.options.annotation
      _ = appDelegate?.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  // Expo 55 subscribers still expect these delegate callbacks. UIKit supplies
  // UIApplication notifications for RN AppState; do not post duplicates here.
  func sceneDidBecomeActive(_ scene: UIScene) {
    appDelegate?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    appDelegate?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    appDelegate?.applicationDidEnterBackground(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    appDelegate?.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    window?.isHidden = true
    window?.windowScene = nil
    window = nil
  }
}
