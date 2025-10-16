import type { BaseDevice } from "./brmesh-qr-decrypt";

const domQueryResults = {
  canvasElement: document.querySelector<HTMLCanvasElement>("#canvas"),
  loadingMessage: document.querySelector<HTMLSpanElement>("#loadingMessage"),
  outputContainer: document.querySelector<HTMLSpanElement>("#output"),
  meshKeyElement: document.querySelector<HTMLCanvasElement>("#mesh-key"),
  outputData: document.querySelector<HTMLDivElement>("#outputData"),
  errorDisplay: document.querySelector<HTMLDivElement>("#error-display"),
  errorReason: document.querySelector<HTMLSpanElement>("#error-reason"),
  cameraStartBtn: document.querySelector<HTMLButtonElement>("#camera-start"),
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

export const dataComponent =
  ({
    outputContainer,
    errorDisplay,
    instructionContainer,
  }: Pick<Awa, "outputContainer" | "errorDisplay" | "instructionContainer">) =>
  (state: "instruction" | "output" | "error") => {
    if (state === "instruction") {
      errorDisplay.classList.add("hidden");
      outputContainer.classList.add("hidden");

      instructionContainer.classList.remove("hidden");
    } else if (state === "output") {
      instructionContainer.classList.add("hidden");
      errorDisplay.classList.add("hidden");

      outputContainer.classList.remove("hidden");
    } else if (state === "error") {
      instructionContainer.classList.add("hidden");
      outputContainer.classList.add("hidden");

      errorDisplay.classList.remove("hidden");
    }
  };

export const buttonsCanvas =
  ({
    canvasElement,
    loadingMessage,
    cameraStartBtn,
  }: Pick<Awa, "canvasElement" | "loadingMessage" | "cameraStartBtn">) =>
  (state: "buttons" | "canvas" | "loading") => {
    if (state === "buttons") {
      canvasElement.classList.add("hidden");
      loadingMessage.classList.add("hidden");

      cameraStartBtn.classList.remove("hidden");
    } else if (state === "canvas") {
      cameraStartBtn.classList.add("hidden");
      loadingMessage.classList.add("hidden");

      canvasElement.classList.remove("hidden");
    } else if (state === "loading") {
      cameraStartBtn.classList.add("hidden");
      canvasElement.classList.add("hidden");

      loadingMessage.classList.remove("hidden");
    }
  };
