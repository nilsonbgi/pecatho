export const AGE_VERIFICATION_EVENT = "pecatho:age-verification-changed";

export function getAgeVerificationSnapshot() {
  return window.localStorage.getItem("pecatho_age_verified") === "true";
}

export function subscribeToAgeVerification(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(AGE_VERIFICATION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AGE_VERIFICATION_EVENT, onChange);
  };
}

export function confirmAgeVerification() {
  window.localStorage.setItem("pecatho_age_verified", "true");
  window.dispatchEvent(new Event(AGE_VERIFICATION_EVENT));
}
