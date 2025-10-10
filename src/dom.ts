import type { BaseDevice } from "./brmesh-qr-decrypt";

const domQueryResults = {
  canvasElement: document.querySelector<HTMLCanvasElement>("#canvas"),
  loadingMessage: document.querySelector<HTMLSpanElement>("#loadingMessage"),
  outputContainer: document.querySelector<HTMLSpanElement>("#output"),
  meshKeyElement: document.querySelector<HTMLCanvasElement>("#mesh-key"),
  outputMessage: document.querySelector<HTMLSpanElement>("#outputMessage"),
  outputData: document.querySelector<HTMLSpanElement>("#outputData"),
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
  const data = document.createElement("pre");
  data.innerText = JSON.stringify(device);

  const container = document.createElement("div");
  container.className = "device-details";
  container.appendChild(data);
  return container;
};
