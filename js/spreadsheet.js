/* ==========================================================
   spreadsheet.js — Upload e processamento da planilha
   Usa SheetJS + Supabase + Marcadores automáticos
========================================================== */

import { showToast } from "/js/utils.js";
import { clients, loadClientsFromSupabase } from "/js/clients.js";
import { addMatchedMarker, clearMatchedMarkers } from "/js/markers.js";

/* ==========================================================
   ELEMENTOS
========================================================== */

let uploadArea;
let fileInput;
let progressFill;
let progressText;
let resultBox;

/* ==========================================================
   SUPABASE
========================================================== */

const SUPABASE_URL = "https://pstiwhopekblruynrfbv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdGl3aG9wZWtibHJ1eW5yZmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzMyNzgsImV4cCI6MjA1MTIwOTI3OH0.enSadNFS48baryc-Z2HqU-Kl-QzslZf2ZzS0PTsuU10";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ==========================================================
   INICIALIZAÇÃO
========================================================== */
export function initSpreadsheetUpload() {
    uploadArea = document.getElementById("upload-area");
    fileInput = document.getElementById("file-input");
    progressFill = document.getElementById("progress-fill");
    progressText = document.getElementById("progress-text");
    resultBox = document.getElementById("upload-result");

    uploadArea.onclick = () => fileInput.click();
    fileInput.onchange = handleFileSelect;

    uploadArea.ondragover = e => {
        e.preventDefault();
        uploadArea.style.background = "#eef5ff";
    };

    uploadArea.ondragleave = () => {
        uploadArea.style.background = "#fafafa";
    };

    uploadArea.ondrop = e => {
        e.preventDefault();
        uploadArea.style.background = "#fafafa";
        if (e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };
}

/* ==========================================================
   SELEÇÃO DE ARQUIVO
========================================================== */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
}

/* ==========================================================
   PROCESSAR ARQUIVO XLSX/CSV
========================================================== */
async function processFile(file) {
    resultBox.classList.add("hidden");
    progressFill.style.width = "0%";
    progressText.textContent = "Processando planilha...";

    document.getElementById("upload-progress").classList.remove("hidden");

    const reader = new FileReader();

    reader.onload = async evt => {
        const data = evt.target.result;

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (sheet.length === 0) {
            showToast("A planilha está vazia.", "warning");
            return;
        }

        updateProgress(40, "Analisando dados...");
        clearMatchedMarkers();

        const matched = matchClients(sheet);

        updateProgress(75, "Salvando resultados...");

        // Salvar planilha no Supabase
        await supabase.from("planilha_dia").delete().neq("id", 0);
        await supabase.from("planilha_dia").insert(sheet);

        updateProgress(100, "Concluído!");

        renderResults(matched);
        showToast("Planilha atualizada com sucesso!", "success", 2500);
    };

    reader.onerror = () => {
        showToast("Erro ao ler arquivo.", "error");
    };

    reader.readAsBinaryString(file);
}

/* ==========================================================
   ATUALIZAR BARRA DE PROGRESSO
========================================================== */
function updateProgress(percent, text) {
    progressFill.style.width = percent + "%";
    progressText.textContent = text;
}

/* ==========================================================
   VERIFICAR CLIENTES DA PLANILHA
========================================================== */
function matchClients(rows) {
    const matched = [];

    rows.forEach(row => {
        const name = row["Nome"] || row["Cliente"] || row["nome"] || "";
        if (!name) return;

        const found = clients.find(c =>
            c.name.toLowerCase().trim() === name.toLowerCase().trim()
        );

        if (found) {
            matched.push(found);
            addMatchedMarker(found);
        }
    });

    return matched;
}

/* ==========================================================
   MOSTRAR RESULTADOS
========================================================== */
function renderResults(list) {
    const box = resultBox;
    box.classList.remove("hidden");

    if (list.length === 0) {
        box.innerHTML = "<b>Nenhum cliente da planilha foi encontrado no sistema.</b>";
        return;
    }

    box.innerHTML = `
        <b>Clientes encontrados na planilha:</b><br><br>
        ${list.map(c => `• ${c.name}`).join("<br>")}
    `;
}