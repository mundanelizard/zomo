/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";
import { checkPlatform } from "../utils/platform";
import {
  ACCOUNT,
  TOKEN,
  SERVER_URL,
  REPOSITORY,
  PRE,
  INTERVAL,
} from "../config";
import { ServiceError } from "../utils";

class CacheService {
  private static cacheService: CacheService;
  private latest: Record<string, any> = {};
  private lastUpdate = 0;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.cacheService) {
      return new CacheService();
    }

    return CacheService.cacheService;
  }

  async hardRefreshCache() {
    this.latest = {};
    this.lastUpdate = 0;
    this.refresh();
  }

  async releasList(url: string, nupkgUrl: string) {
    const assetUrl = url.replace(
      "https://api.github.com",
      `https://${TOKEN}@api.github.com/`
    );

    const headers = { Accept: "application/octet-stream" };
    const response = await fetch(assetUrl, { headers });

    if (response.status !== 200) {
      throw new ServiceError(
        response.status,
        `Unable to cache RELEASES: Can't fetch ${url}.`
      );
    }

    const content = await response.text();
    const matches = content.match(/[^ ]*\.nupkg/gim);

    if (matches?.length === 0 || !matches) {
      throw new ServiceError(
        400,
        `Unable to cache RELEASES: ${url} has no body.`
      );
    }

    const updateVersion = matches[0];

    const downloadUrl = `${SERVER_URL}/proxy/${updateVersion}?url=${nupkgUrl}`;
    return content.replace(matches[0], downloadUrl);
  }

  async refresh() {
    const repo = ACCOUNT + "/" + REPOSITORY;
    const url = `https://api.github.com/repos/${repo}/releases?per_page=100`;
    const headers: Record<string, any> = {
      Accept: "application/vnd.github.preview",
    };

    if (TOKEN) {
      headers["Authorization"] = `token ${TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (response.status !== 200) {
      throw new ServiceError(
        response.status,
        `GitHub API responded with ${response.status} for url ${url}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const release = data.find((item) => {
      const isPre = Boolean(PRE) === Boolean(item.prerelease);
      return !item.draft && isPre;
    });

    if (!release || !release.assets || !Array.isArray(release.assets)) {
      return;
    }

    const { tag_name: tagName } = release;

    if (this.latest.version === tagName) {
      this.lastUpdate = Date.now();
      return;
    }

    console.log(`Caching ${tagName}`);
    // updating cache
    this.latest.version = tagName;
    this.latest.notes = release.body;
    this.latest.pub_date = release.published_at;
    this.latest.platforms = {};

    const nupkgAsset = release.assets.find(
      (asset: { name: string }) => asset.name.indexOf("nupkg") !== 0
    );

    for (const asset of release.assets) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const { name, browser_download_url, url, content_type, size } = asset;

      if (name === "RELEASES") {
        if (!this.latest.files) {
          this.latest.files = {};
        }

        this.releasList(url, nupkgAsset.url)
          .then((result) => (this.latest.files.RELEASES = result))
          .catch(console.log);
        continue;
      }

      const platform = checkPlatform(name);

      if (!platform) {
        continue;
      }

      this.latest.platforms[platform] = {
        name,
        api_url: url,
        url: browser_download_url,
        content_type,
        size: Math.round((size / 1000000) * 10) / 10, // converting size
      };
    }

    console.log(`Cached ${tagName}`);
    this.lastUpdate = Date.now();
  }

  isOutdated() {
    const updateInterval = INTERVAL * 60 * 100;

    if (this.lastUpdate && Date.now() - this.lastUpdate > updateInterval) {
      return true;
    }

    return false;
  }

  async load() {
    if (!this.lastUpdate || this.isOutdated()) {
      await this.refresh();
    }

    return Object.assign({}, this.latest);
  }
}

export default CacheService;
