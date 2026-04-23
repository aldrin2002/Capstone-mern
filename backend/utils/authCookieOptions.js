const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const normalizeSameSite = (value) => {
  const normalized = (value || "").toLowerCase();

  if (normalized === "strict" || normalized === "lax" || normalized === "none") {
    return normalized;
  }

  return null;
};

const getSameSite = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const envSameSite = normalizeSameSite(process.env.COOKIE_SAME_SITE);

  if (envSameSite) {
    return envSameSite;
  }

  // Use 'none' in production so auth still works when frontend/backend use different domains.
  return isProduction ? "none" : "lax";
};

export const getAuthCookieOptions = () => {
  const sameSite = getSameSite();
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE,
    sameSite,
    secure: isProduction || sameSite === "none",
    path: "/",
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  return cookieOptions;
};

export const getClearAuthCookieOptions = () => {
  const cookieOptions = getAuthCookieOptions();

  return {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path,
    ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
  };
};