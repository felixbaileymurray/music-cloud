# Changelog

All notable changes to Music Cloud are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## 0.2.0

This release builds on the initial music cloud concept, and makes sweeping usability and technical improvements.

### Added

- Spotify OAuth integration; pulls listening history directly from a user's Spotify account
- Split create flow into three branches; Connect Spotify, Create Manually, See an example
- Introduce tracks option as well as albums for manual creation; eventually tracks/albums/artists available for all create types
- Share functionality; copyable link (≤50 items) and JSON download/open
- Save functionality; PNG/JPEG/WebP image export and JSON cloud snapshot
- UI enhancements; canvas zoom control, additional customisation options, information structure

### Changed

- Create-cloud onboarding and sidebar detail; actions, panels, genre tags
- Improved cloud physics
- Development controls split from Customise and updated defaults
- Share/export based on the current view

## 0.1.0

Initial release on main.

Music cloud is a music visualisation and discovery app.

This first release focuses on an album view, and introduces the core building blocks:

- An interactive canvas
- Dynamic cloud physics
- Album cover and metadata display
- Audio retrieval and playback
- Astryx design system integration
- Basic onboarding / cloud creation journey
