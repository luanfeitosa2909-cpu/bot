/**
 * DisCloud Production Environment Configuration
 * Configured exclusively for DisCloud deployment
 */

// Discloud domain
const DISCLOUD_DOMAIN = 'https://brasilsimracing.discloud.app';

/**
 * Get the appropriate base URL for the frontend (always DisCloud)
 */
export const getFrontendUrl = (): string => {
  return DISCLOUD_DOMAIN;
};

/**
 * Get the appropriate base URL for the backend API (always DisCloud)
 */
export const getBackendUrl = (): string => {
  return DISCLOUD_DOMAIN;
};

/**
 * Get Steam authentication URLs
 */
export const getSteamAuthUrls = () => {
  const frontendUrl = getFrontendUrl();
  
  return {
    returnUrl: `${frontendUrl}/auth/steam/return`,
    realm: frontendUrl,
  };
};

// Export environment info for debugging
export const envConfig = {
  discloudDomain: DISCLOUD_DOMAIN,
  frontendUrl: getFrontendUrl(),
  backendUrl: getBackendUrl(),
};

console.log('[DisCloud Environment Config]', envConfig);
