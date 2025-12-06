/* ==========================================================
   qr.js — Scanner de QR Code (Clientes + Pacotes)
   Usa jsQR + câmera nativa
========================================================== */

import { showToast } from "/js/utils.js";

/* ==========================================================
   VARIÁVEIS GLOBAIS
========================================================== */
let qrStream = null;
let scanningClient = false;
let scanningPackage = false;

let qrVideo, qrCanvas, qrCtx;
let qrPackageVideo, qrPackageCanvas, qrPackageCtx;

/* ==========================================================
   INICIALIZA MODAL DE CLIENTE
========================================================== */
export function initQRClientModal() {
    qrVideo = document.getElementById("qr-video");
    qrCanvas = document.getElementById("qr-canvas");
    qrCtx = qrCanvas.getContext("2d");

    document.getElementById("modal-client").addEventListener("transitionend", () => {
        const modal = document.getElementById("modal-client");

        if (modal.classList.contains("active")) {
            startClientScanner();
        } else {
            stopScanner();
        }
    });
}

/* ==========================================================
   INICIALIZA MODAL DE PACOTE
========================================================== */
export function initQRPackageModal() {
    qrPackageVideo = document.getElementById("qr-package-video");
    qrPackageCanvas = document.getElementById("qr-package-canvas");
    qrPackageCtx = qrPackageCanvas.getContext("2d");

    document.getElementById("modal-package").addEventListener("transitionend", () => {
        const modal = document.getElementById("modal-package");

        if (modal.classList.contains("active")) {
            startPackageScanner();
        } else {
            stopScanner();
        }
    });
}

/* ==========================================================
   INICIAR SCANNER (CLIENTE)
========================================================== */
async function startClientScanner() {
    scanningClient = true;
    scanningPackage = false;

    try {
        qrStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        qrVideo.srcObject = qrStream;
        qrVideo.play();

        scanClientLoop();
    } catch (err) {
        console.error(err);
        showToast("Não foi possível acessar a câmera.", "error");
    }
}

/* ==========================================================
   LOOP DO SCANNER — CLIENTE
========================================================== */
function scanClientLoop() {
    if (!scanningClient) return;

    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        qrCanvas.width = qrVideo.videoWidth;
        qrCanvas.height = qrVideo.videoHeight;

        qrCtx.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

        const imageData = qrCtx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        const code = jsQR(imageData.data, qrCanvas.width, qrCanvas.height);

        if (code) {
            handleClientQRCode(code.data);
            return;
        }
    }

    requestAnimationFrame(scanClientLoop);
}

/* ==========================================================
   PROCESSAR QR — CLIENTE
========================================================== */
function handleClientQRCode(text) {
    showToast("QR Code detectado!", "success");

    document.getElementById("address-display").classList.remove("hidden");
    document.getElementById("address-text").textContent = text;

    stopScanner();
}

/* ==========================================================
   INICIAR SCANNER (PACOTE)
========================================================== */
async function startPackageScanner() {
    scanningClient = false;
    scanningPackage = true;

    try {
        qrStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        qrPackageVideo.srcObject = qrStream;
        qrPackageVideo.play();

        scanPackageLoop();
    } catch (err) {
        console.error(err);
        showToast("Não foi possível acessar a câmera.", "error");
    }
}

/* ==========================================================
   LOOP DO SCANNER — PACOTE
========================================================== */
function scanPackageLoop() {
    if (!scanningPackage) return;

    if (qrPackageVideo.readyState === qrPackageVideo.HAVE_ENOUGH_DATA) {
        qrPackageCanvas.width = qrPackageVideo.videoWidth;
        qrPackageCanvas.height = qrPackageVideo.videoHeight;

        qrPackageCtx.drawImage(
            qrPackageVideo,
            0,
            0,
            qrPackageCanvas.width,
            qrPackageCanvas.height
        );

        const imageData = qrPackageCtx.getImageData(
            0,
            0,
            qrPackageCanvas.width,
            qrPackageCanvas.height
        );

        const code = jsQR(imageData.data, qrPackageCanvas.width, qrPackageCanvas.height);

        if (code) {
            handlePackageQRCode(code.data);
            return;
        }
    }

    requestAnimationFrame(scanPackageLoop);
}

/* ==========================================================
   PROCESSAR QR — PACOTE
========================================================== */
function handlePackageQRCode(data) {
    const resultBox = document.getElementById("scan-result");
    const status = document.getElementById("qr-package-status");

    status.textContent = "Código detectado!";
    resultBox.textContent = data;
    resultBox.classList.remove("hidden");

    showToast("Pacote identificado!", "success");

    stopScanner();
}

/* ==========================================================
   PARAR SCANNER (GENÉRICO)
========================================================== */
export function stopScanner() {
    scanningClient = false;
    scanningPackage = false;

    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
}