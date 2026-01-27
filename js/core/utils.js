export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Optim: Prevents functions from firing too often 
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function optimizeWillChange(element) {
  element.addEventListener("mouseenter", () => {
    element.style.willChange = "transform";
  });
  element.addEventListener("mouseleave", () => {
    element.style.willChange = "auto";
  });
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
