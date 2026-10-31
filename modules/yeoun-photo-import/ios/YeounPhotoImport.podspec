Pod::Spec.new do |s|
  s.name = 'YeounPhotoImport'
  s.version = '0.1.0'
  s.summary = 'Bounded local photo decoding for Yeoun'
  s.description = s.summary
  s.author = 'Yeoun'
  s.homepage = 'https://github.com/ddoniddoni/yeoun'
  s.license = { :type => 'Proprietary' }
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.source = { :git => 'https://github.com/ddoniddoni/yeoun.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'ImageIO', 'CoreGraphics', 'UniformTypeIdentifiers'
  s.source_files = '**/*.swift'
end
