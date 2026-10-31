# Three.js (local runtime dependency)

Version: **0.180.0**, MIT license (see LICENSE).

Source: https://registry.npmjs.org/three/-/three-0.180.0.tgz

The archive SHA-512 was verified against npm registry metadata before extracting:

```
sha512-o+qycAMZrh+TsE01GqWUxUIKR1AL0S8pq7zDkYOQw8GqfX8b8VoCKYUoHbhiX5j+7hr8XsuHDVU6+gkQJQKg9w==
```

Unmodified files retained from the package:

- `build/three.module.min.js`
- `build/three.core.min.js`
- `examples/jsm/controls/OrbitControls.js`
- `LICENSE`

The import map in `index.html` resolves OrbitControls' `three` import locally.
No CDN requests, install step or build step are required on GitHub Pages.
The renderer is loaded lazily when the learner selects 3D.
