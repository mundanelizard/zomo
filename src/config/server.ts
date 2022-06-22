/**
 * Server URL
 */
export const PORT = process.env.PORT || 5000;

export const REFRESH_TOKEN = process.env.REFRESH_TOKEN || "";
export const PRIVATE_DOWNLOAD = process.env.PRIVATE_DOWNLOAD || "";

export const ACCOUNT = process.env.GITHUB_ACCOUNT || "";
export const TOKEN = process.env.GITHUB_ACCOUNT_TOKEN || "";
export const SERVER_URL = process.env.DOWNLOAD_SERVER_URL || "";
export const REPOSITORY = process.env.GITHUB_REPOSITORY || "";
export const PRE = process.env.PRE || "";
export const INTERVAL = parseInt(process.env.REFRESH_INTERVAL || "15");

if (!ACCOUNT || !REPOSITORY) {
  const error: any = new Error(
    "GITHUB_ACCOUNT or GITHUB_REPOSITORY environment variables are missing."
  );
  error.code = "missing_configuration_properties";
  throw error;
}

if (TOKEN && !SERVER_URL) {
  const error: any = new Error(
    "SEVER_URL is not defined, which is mandatory for private repo mode"
  );
  error.code = "missing_configuration_properties";
  throw error;
}
