import fetch from "node-fetch";
import { TOKEN } from "../config";
import { ServiceError } from "../utils";

class ProxyService {
  private static proxyService: ProxyService;

  private constructor() {}

  static getInstance(): ProxyService {
    if (!ProxyService.proxyService) {
      return new ProxyService();
    }

    return ProxyService.proxyService;
  }

  async proxy(url: string) {
    if (!url) {
      new ServiceError(400, "Bad Request");
    }

    const options = {
      headers: { Accept: "application/octet-stream" },
      redirect: "manual",
    };

    const authenticatedUrl = url.replace(
      "https://api.github.com/",
      `https://${TOKEN}@api.github.com/`
    );

    const r = await fetch(authenticatedUrl, options as any);
    const newLocation = r.headers.get("Location");

    if (!newLocation) {
      throw new ServiceError(404, "Not Found");
    }

    return {
      location: newLocation,
    };
  }
}

export default ProxyService;
