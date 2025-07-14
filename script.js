let discesaCount = 0;
let scaricoInCorso = false;
let pausaInCorso = false;
let turnoInCorso = false;
let log = [];
let currentDiscesa = null;
let startTime = null;

const raccoltaCounts = {
  'Sacchetto/Bidoncino': 0,
  '120lt': 0,
  '240lt': 0,
  '360lt': 0,
  '1100lt': 0,
  'Cestini': 0
};

const segnalazioniCounts = {
  'BidoneDaSostituire': 0,
  'FondoSconnesso': 0,
  'ManovraPericolosa': 0,
  'AbbandonoMezzo': 0
};

function getSanitizedId(tipo) {
  return tipo.replace(/[^a-zA-Z0-9]/g, '');
}

function updateBadge(badgeId, value) {
  const el = document.getElementById(badgeId);
  if (el) {
    el.textContent = value;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  for (const tipo in raccoltaCounts) {
    updateBadge(`count-${getSanitizedId(tipo)}`, raccoltaCounts[tipo]);
  }
  caricaStato();
});

function updateLogDisplay() {
  const logDiv = document.getElementById('log');
  logDiv.innerHTML = '<h3>Attività registrate</h3>' + log.map((r) =>
    `[${r.timestamp}] ${r.azione}${r.dettagli ? ' - ' + r.dettagli : ''} (Discesa: ${r.discesa ?? '-'})`
  ).join('<br>');
  logDiv.scrollTop = logDiv.scrollHeight;
  salvaStato();
}

function timestamp() {
  return new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
}

function toggleTurno() {
  turnoInCorso = !turnoInCorso;
  const azione = turnoInCorso ? "Inizio Turno" : "Fine Turno";
  log.push({ timestamp: timestamp(), azione, dettagli: "-", discesa: "-" });
  updateLogDisplay();
}

function togglePausa() {
  pausaInCorso = !pausaInCorso;
  const azione = pausaInCorso ? "Inizio Pausa" : "Fine Pausa";
  log.push({ timestamp: timestamp(), azione, dettagli: "-", discesa: "-" });
  updateLogDisplay();
}

function startDiscesa() {
  if (currentDiscesa !== null) {
    finalizzaDiscesa();
  }
  discesaCount++;
  currentDiscesa = discesaCount;
  startTime = new Date();
  log.push({ timestamp: timestamp(), azione: "Discesa", dettagli: "-", discesa: currentDiscesa });
  updateLogDisplay();
}

function finalizzaDiscesa() {
  const raccolte = Object.entries(raccoltaCounts).map(([k, v]) => `${k}=${v}`).filter((_, i, a) => a[i].split('=')[1] > 0).join(", ");
  if (raccolte) log.push({ timestamp: timestamp(), azione: "Conteggio Raccolta Finale", dettagli: raccolte, discesa: currentDiscesa });

  const segn = Object.entries(segnalazioniCounts).map(([k, v]) => `${k}=${v}`).filter((_, i, a) => a[i].split('=')[1] > 0).join(", ");
  if (segn) log.push({ timestamp: timestamp(), azione: "Conteggio Segnalazioni Finale", dettagli: segn, discesa: currentDiscesa });

  log.push({ timestamp: timestamp(), azione: "Fine Discesa", dettagli: "-", discesa: currentDiscesa });

  for (const tipo in raccoltaCounts) {
    raccoltaCounts[tipo] = 0;
    updateBadge(`count-${getSanitizedId(tipo)}`, 0);
  }
  for (const tipo in segnalazioniCounts) {
    segnalazioniCounts[tipo] = 0;
  }

  currentDiscesa = null;
}

function toggleScarico() {
  scaricoInCorso = !scaricoInCorso;
  const azione = scaricoInCorso ? "Inizio Scarico" : "Fine Scarico";
  if (!scaricoInCorso && currentDiscesa !== null) {
    finalizzaDiscesa();
  }
  log.push({ timestamp: timestamp(), azione, dettagli: "-", discesa: currentDiscesa ?? "-" });
  updateLogDisplay();
}

function addRaccolta(tipo) {
  if (!currentDiscesa) {
    alert("Inizia una 'Nuova Discesa' prima di registrare la raccolta.");
    return;
  }
  raccoltaCounts[tipo] = (raccoltaCounts[tipo] || 0) + 1;
  updateBadge(`count-${getSanitizedId(tipo)}`, raccoltaCounts[tipo]);
  log.push({ timestamp: timestamp(), azione: "Raccolta", dettagli: tipo, discesa: currentDiscesa });
  updateLogDisplay();
}

function addSegnalazione(tipo) {
  segnalazioniCounts[tipo] = (segnalazioniCounts[tipo] || 0) + 1;
  log.push({ timestamp: timestamp(), azione: "Segnalazione", dettagli: tipo, discesa: currentDiscesa ?? "-" });
  updateLogDisplay();
}

function inserisciNota() {
  const nota = prompt("Inserisci una nota:");
  if (nota) {
    log.push({ timestamp: timestamp(), azione: "Nota", dettagli: nota, discesa: currentDiscesa ?? "-" });
    updateLogDisplay();
  }
}

function annullaUltima() {
  const ultima = log.pop();
  if (!ultima) return;

  const tipo = ultima.dettagli;

  if (ultima.azione === "Raccolta" && raccoltaCounts.hasOwnProperty(tipo)) {
    raccoltaCounts[tipo]--;
    updateBadge(`count-${getSanitizedId(tipo)}`, raccoltaCounts[tipo]);
  } else if (ultima.azione === "Segnalazione" && segnalazioniCounts.hasOwnProperty(tipo)) {
    segnalazioniCounts[tipo]--;
  } else if (ultima.azione === "Discesa") {
    discesaCount--;
    currentDiscesa = discesaCount > 0 ? discesaCount : null;
  } else if (ultima.azione.includes("Scarico")) {
    scaricoInCorso = ultima.azione.startsWith("Fine") ? true : false;
  } else if (ultima.azione.includes("Pausa")) {
    pausaInCorso = ultima.azione.startsWith("Fine") ? true : false;
  } else if (ultima.azione.includes("Turno")) {
    turnoInCorso = ultima.azione.startsWith("Fine") ? true : false;
  }

  updateLogDisplay();
}

function resetDati() {
  if (confirm("Sei sicuro di voler cancellare tutti i dati?")) {
    discesaCount = 0;
    currentDiscesa = null;
    startTime = null;
    scaricoInCorso = false;
    pausaInCorso = false;
    turnoInCorso = false;
    log = [];

    for (const tipo in raccoltaCounts) {
      raccoltaCounts[tipo] = 0;
      updateBadge(`count-${getSanitizedId(tipo)}`, 0);
    }
    for (const tipo in segnalazioniCounts) {
      segnalazioniCounts[tipo] = 0;
    }
    localStorage.removeItem("registro_log");
    updateLogDisplay();
  }
}

function exportExcel() {
  const nomeFile = document.getElementById("filename").value;
  if (!nomeFile) {
    alert("Inserisci un nome per il file!");
    return;
  }
  const righe = [["Ora", "Azione", "Dettagli", "Discesa"]];
  log.forEach(entry => {
    const [datePart, timePart] = entry.timestamp.split(', ');
    righe.push([timePart, entry.azione, entry.dettagli || '', entry.discesa || '-']);
  });
  const csv = righe.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function salvaStato() {
  localStorage.setItem("registro_log", JSON.stringify({
    log,
    raccoltaCounts,
    segnalazioniCounts,
    discesaCount,
    currentDiscesa,
    scaricoInCorso,
    pausaInCorso,
    turnoInCorso
  }));
}

function caricaStato() {
  const dati = localStorage.getItem("registro_log");
  if (!dati) return;
  try {
    const stato = JSON.parse(dati);
    log = stato.log || [];
    discesaCount = stato.discesaCount || 0;
    currentDiscesa = stato.currentDiscesa || null;
    scaricoInCorso = stato.scaricoInCorso || false;
    pausaInCorso = stato.pausaInCorso || false;
    turnoInCorso = stato.turnoInCorso || false;

    Object.assign(raccoltaCounts, stato.raccoltaCounts || {});
    Object.assign(segnalazioniCounts, stato.segnalazioniCounts || {});
    for (const tipo in raccoltaCounts) {
      updateBadge(`count-${getSanitizedId(tipo)}`, raccoltaCounts[tipo]);
    }
    updateLogDisplay();
  } catch (e) {
    console.error("Errore nel recupero dello stato salvato:", e);
  }
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('SW registrato:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}

// Rifornimento
let rifornimentoInCorso = false;
function toggleRifornimento() {
  rifornimentoInCorso = !rifornimentoInCorso;
  const azione = rifornimentoInCorso ? "Inizio Rifornimento" : "Fine Rifornimento";
  log.push({ timestamp: timestamp(), azione, dettagli: "-", discesa: currentDiscesa ?? "-" });
  updateLogDisplay();
}

function aggiungiAzione(nome) {
  log.push({ timestamp: timestamp(), azione: nome, dettagli: "-", discesa: currentDiscesa ?? "-" });
  updateLogDisplay();
}

// Conferma uscita
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "Stai per uscire. Vuoi salvare prima?";
});
