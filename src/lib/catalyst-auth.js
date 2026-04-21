export const CATALYST_LOGIN_PATH =
  import.meta.env.VITE_CATALYST_LOGIN_PATH || "/__catalyst/auth/login";

export const getCatalyst = () => window.catalyst || null;

export const getCatalystAuthOrigin = () =>
  (import.meta.env.VITE_CATALYST_AUTH_ORIGIN || "").trim() || window.location.origin;

export const getLoginUrl = () => new URL(CATALYST_LOGIN_PATH, getCatalystAuthOrigin()).toString();

export const signInWithCatalyst = () => {
  window.location.assign(getLoginUrl());
};

export const signOutFromCatalyst = () => {
  const catalyst = getCatalyst();
  const redirectUrl = getLoginUrl();

  if (catalyst?.auth?.signOut) {
    catalyst.auth.signOut(redirectUrl);
    return;
  }

  window.location.assign(redirectUrl);
};

export const isCatalystSdkAvailable = () => Boolean(getCatalyst()?.auth);
