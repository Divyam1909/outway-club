/**
 * Loads Razorpay's checkout script on demand.
 *
 * Resolves false rather than rejecting, so callers handle "gateway unavailable"
 * as a normal branch with a written message instead of a thrown error.
 *
 * A previous failed attempt leaves its <script> tag in the DOM. Treating that
 * tag as proof of success would report a working gateway when there isn't one,
 * so readiness is judged by `window.Razorpay` actually being defined, and a
 * failed tag is removed to allow a genuine retry.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    // Already loaded and usable.
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      // A tag is present but the global isn't — either still in flight, or a
      // previous load failed. Wait for this one, then give up cleanly.
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener(
        "error",
        () => {
          existing.remove();
          resolve(false);
        },
        { once: true }
      );

      // The listeners above never fire for a tag that finished before we got
      // here, so fall back to a bounded poll instead of hanging forever.
      let waited = 0;
      const poll = window.setInterval(() => {
        waited += 200;
        if (window.Razorpay) {
          window.clearInterval(poll);
          resolve(true);
        } else if (waited >= 8000) {
          window.clearInterval(poll);
          existing.remove();
          resolve(false);
        }
      }, 200);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
