import type { BaseDevice } from "./brmesh-qr-decrypt";

const domQueryResults = {
  canvasElement: document.querySelector<HTMLCanvasElement>("#canvas"),
  loadingMessage: document.querySelector<HTMLSpanElement>("#loadingMessage"),
  outputContainer: document.querySelector<HTMLSpanElement>("#output"),
  meshKeyElement: document.querySelector<HTMLCanvasElement>("#mesh-key"),
  outputData: document.querySelector<HTMLSpanElement>("#outputData"),
  errorDisplay: document.querySelector<HTMLDivElement>("#error-display"),
  errorReason: document.querySelector<HTMLSpanElement>("#error-reason"),
  cameraStart: document.querySelector<HTMLButtonElement>("#camera-start"),
  instructionContainer: document.querySelector<HTMLDivElement>(
    "#instruction-container"
  ),
  instructionText: document.querySelector<HTMLSpanElement>("#instruction-text"),
};

export type Awa = {
  [key in keyof typeof domQueryResults]: Exclude<
    (typeof domQueryResults)[key],
    null
  >;
};

export const attachToDom = ():
  | { ok: true; domElements: Awa }
  | { ok: false } => {
  const thing = Object.entries(domQueryResults);

  if (thing.some(([_name, element]) => element === null)) {
    return { ok: false };
  }

  // the compiler cant tell but none of these are null
  return { ok: true, domElements: domQueryResults as Awa };
};

export const createDeviceDetailsElement = (device: BaseDevice) => {
  const title = document.createElement("summary");
  title.innerText = device.n;

  const data = document.createElement("pre");
  data.innerText = JSON.stringify(device, null, 2);

  const container = document.createElement("details");
  container.className = "device-details";
  container.appendChild(title);
  container.appendChild(data);
  return container;
};

export const loadingComponent = (loadingMessage: HTMLSpanElement) => ({
  show: () => {
    loadingMessage.innerText = "⌛ Loading video...";
    loadingMessage.classList.remove("hidden");
  },
  hide: () => {
    loadingMessage.classList.add("hidden");
    loadingMessage.innerText = "";
  },
});
