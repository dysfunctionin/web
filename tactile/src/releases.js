export const RELEASES_URL = "https://api.github.com/repos/dysfunctionin/tactile/releases?per_page=30";
export const RELEASES_PAGE = "https://github.com/dysfunctionin/tactile/releases";

const packagePatterns = {
  windows: [{ label: "MSI", pattern: /\.msi$/i }],
  macos: [{ label: "DMG", pattern: /\.dmg$/i }],
  linux: [
    { label: "AppImage", pattern: /\.appimage$/i },
    { label: "DEB", pattern: /\.deb$/i },
  ],
};

export function selectChannels(releases) {
  const published = releases.filter((release) => !release.draft && release.tag_name !== "nightly");
  return {
    alpha: published.find((release) => release.prerelease) || null,
    stable: published.find((release) => !release.prerelease) || null,
  };
}

export function packagesFor(release, platform) {
  if (!release) return [];
  return packagePatterns[platform].flatMap(({ label, pattern }) => {
    const asset = release.assets?.find(({ name }) => pattern.test(name) && !name.endsWith(".sig"));
    return asset ? [{ label, name: asset.name, url: asset.browser_download_url }] : [];
  });
}

export function preferredPlatform(userAgent = navigator.userAgent) {
  if (/mac/i.test(userAgent)) return "macos";
  if (/linux/i.test(userAgent)) return "linux";
  return "windows";
}