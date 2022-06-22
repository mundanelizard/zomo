import CacheService from "./cache";
import { Details } from "express-useragent";
import ProxyService from "./proxy";
import { checkAlias } from "../utils/aliases";
import { valid, compare } from "semver";
import { REFRESH_TOKEN, PRIVATE_DOWNLOAD, SERVER_URL } from "../config";
import { ServiceError } from "../utils";

class UpdateService {
  private static updateService: UpdateService;

  private constructor() {}

  static getInstance(): UpdateService {
    if (!UpdateService.updateService) {
      return new UpdateService();
    }

    return UpdateService.updateService;
  }

  async refresh(token: string) {
    if (!token && REFRESH_TOKEN) {
      throw new ServiceError(401, "Unauthorised");
    }

    if (REFRESH_TOKEN && token !== REFRESH_TOKEN) {
      throw new ServiceError(401, "Unauthorised");
    }

    return await CacheService.getInstance().hardRefreshCache();
  }

  async download(userAgent: Details, isUpdate: boolean) {
    let platform;

    if (userAgent.isMac && isUpdate) {
      platform = "darwin";
    } else if (userAgent.isMac && !isUpdate) {
      platform = "dmg";
    } else if (userAgent.isWindows && isUpdate) {
      platform = "nupkg";
    } else if (userAgent.isWindows) {
      platform = "exe";
    }

    const { platforms } = await CacheService.getInstance().load();

    if (!platform || !platforms || !platforms[platform]) {
      throw new ServiceError(404, "No download available for your platform!");
    }

    if (PRIVATE_DOWNLOAD) {
      return await ProxyService.getInstance().proxy(
        platforms[platform].api_url
      );
    }

    return {
      location: platforms[platform].url,
      status: 302,
    };
  }

  async platformDownload(platform: string, isUpdate: boolean) {
    if (platform === "mac" && !isUpdate) {
      platform = "dmg";
    }

    if (platform === "mac_arm64" && !isUpdate) {
      platform = "dmg_arm64";
    }

    // Get the latest version from the cache
    const latest = await CacheService.getInstance().load();

    // Check platform for appropriate aliases
    platform = checkAlias(platform);

    if (!platform) {
      throw new ServiceError(500, "The specified platform is not valid");
    }

    if (!latest.platforms || !latest.platforms[platform]) {
      throw new ServiceError(404, "No download available for your platform");
    }

    if (PRIVATE_DOWNLOAD) {
      return ProxyService.getInstance().proxy(
        latest.platforms[platform].api_url
      );
    }

    return {
      location: latest.platforms[platform].url,
    };
  }

  async update(platformName: string, version: string) {
    if (!valid(version)) {
      throw new ServiceError(
        500,
        "The specified version is not SemVer-compatible"
      );
    }

    const platform = checkAlias(platformName);

    if (!platform) {
      throw new ServiceError(
        500,
        "Invalid Platform: The specified platform is not valid"
      );
    }

    // Get the latest version from the cache
    const latest = await CacheService.getInstance().load();

    if (!latest.platforms || !latest.platforms[platform]) {
      throw new ServiceError(400, "Invalid plaform.");
    }

    if (compare(latest.version, version) === 0) {
      throw new ServiceError(400, "Invalid version.");
    }
    const { notes, pub_date } = latest;

    return {
      name: latest.version,
      notes,
      pub_date,
      url: PRIVATE_DOWNLOAD
        ? `${SERVER_URL}/download/${platformName}?update=true`
        : latest.platforms[platform].url,
    };
  }

  async releases() {
    // Get the latest version from the cache
    const latest = await CacheService.getInstance().load();

    if (!latest.files || !latest.files.RELEASES) {
      throw new ServiceError(404, "Can't find releases");
    }

    return latest.files.RELEASES;
  }
}

export default UpdateService;
