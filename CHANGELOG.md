# Changelog

All notable changes to Music Cloud are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## 0.2.0

Feature batch on the way toward a live product. Renaming, branding, and final journey/copy polish are still ahead; this release ships the capabilities that get us much closer.

### Added

- Spotify OAuth create flow alongside history upload
- Parallel track clouds (one snippet per track) with album mode kept for rotating previews
- Share modal: copyable link (≤50 items) and JSON download/open
- Save modal: PNG/JPEG/WebP image export and JSON cloud snapshot
- “See an example” create path with built-in demo albums
- Canvas zoom control
- Live resolve status in the create flow

### Changed

- Create-cloud onboarding and sidebar hierarchy (actions, detail panels, genre tags)
- Cloud physics feel; development controls split from Customise
- Default visible cloud size and share/export based on the current viewer slice

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
