const { withPodfile } = require('expo/config-plugins');
const marker = '# yeoun-m0: glog textual includes';
const hook = `
    ${marker}
    # glog 0.3.5 includes log_severity.h inside namespace google. Inferred
    # submodules turn that textual include into a forbidden namespace import.
    # Keep the umbrella module; the two namespace-included headers must be textual.
    glog_map = File.join(installer.sandbox.root, 'Target Support Files', 'glog', 'glog.modulemap')
    if File.exist?(glog_map)
      glog_spec = installer.pod_targets.find { |target| target.name == 'glog' }&.root_spec
      raise 'Recheck M0 glog module-map workaround after version change' unless glog_spec&.version.to_s == '0.3.5'
      source = File.read(glog_map)
      fixed = source.gsub(/^[ \\t]*module \\* \\{ export \\* \\}\\n/, '')
      fixed = fixed.sub('umbrella header "glog-umbrella.h"', 'umbrella header "glog-umbrella.h"' + "\\n  textual header \\"glog/log_severity.h\\"\\n  textual header \\"glog/vlog_is_on.h\\"") unless fixed.include?('textual header')
      File.write(glog_map, fixed)
    end
    # RNWorklets uses this private header path itself but does not propagate it
    # to consumers importing its module through VisionCameraWorklets.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        paths = Array(build_config.build_settings['HEADER_SEARCH_PATHS'])
        build_config.build_settings['HEADER_SEARCH_PATHS'] = (paths + ['$(inherited)', '"$(PODS_ROOT)/Headers/Private/React-Core"']).uniq
      end
    end
    installer.aggregate_targets.map(&:user_project).uniq.each do |project|
      project.native_targets.each do |target|
        target.build_configurations.each do |build_config|
          paths = Array(build_config.build_settings['HEADER_SEARCH_PATHS'])
          build_config.build_settings['HEADER_SEARCH_PATHS'] = (paths + ['$(inherited)', '"$(PODS_ROOT)/Headers/Private/React-Core"']).uniq
        end
      end
      project.save
    end
    # yeoun-m0: ios camera end
`;
module.exports = function withGlogModuleMap(config) {
  return withPodfile(config, next => {
    const complete = /\n    # yeoun-m0: glog textual includes[\s\S]*?    # yeoun-m0: ios camera end\n/;
    if (complete.test(next.modResults.contents)) {
      next.modResults.contents = next.modResults.contents.replace(complete, hook);
      return next;
    }
    const previous = /\n    # yeoun-m0: glog textual includes[\s\S]*?\n    end\n/;
    if (previous.test(next.modResults.contents)) {
      next.modResults.contents = next.modResults.contents.replace(previous, hook);
      return next;
    }
    const anchor = 'post_install do |installer|';
    if (!next.modResults.contents.includes(anchor)) throw new Error('Expo Podfile post_install anchor changed; recheck glog workaround');
    next.modResults.contents = next.modResults.contents.replace(anchor, anchor + hook);
    return next;
  });
};
