console.log("chat.js cargado");

const API_URL = "https://hf-api.eligiolayna01.workers.dev";
let PROMPT_BASE = "";
let historial = []; // 🧠 Variable para mantener la memoria de la plática

document.addEventListener("DOMContentLoaded", async () => {
    const input = document.getElementById("user-input");
    const button = document.getElementById("send-btn");

    button.addEventListener("click", enviarMensaje);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") enviarMensaje();
    });

    await cargarPrompt();
    setEstado("Sistema listo");
});

async function cargarPrompt() {
    try {
        const r = await fetch("info.txt");
        PROMPT_BASE = await r.text();
        console.log("Prompt cargado");
    } catch {
        PROMPT_BASE = "";
        console.warn("No se pudo cargar info.txt");
    }
}

function setEstado(texto, error = false) {
    const e = document.getElementById("status-monitor");
    e.innerText = "Estado: " + texto;
    e.style.color = error ? "red" : "lime";
}

async function enviarMensaje() {
    const input = document.getElementById("user-input");
    const texto = input.value.trim();
    if (!texto) return;

    // 1. Guardar lo que escribe el usuario en el historial
    historial.push({ role: "user", content: texto });

    agregarMensaje(texto, "user-msg");
    input.value = "";

    const id = "bot_" + Date.now();
    agregarMensaje("...", "bot-msg", id);

    setEstado("Conectando...");

    try {
        const r = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pregunta: texto,
                prompt: PROMPT_BASE,
                historial: historial // 👈 Enviamos toda la conversación acumulada
            })
        });

        const data = await r.json();
        const respuestaIA = data.answer || "Sin respuesta";

        // 2. Guardar lo que responde el bot en el historial
        historial.push({ role: "assistant", content: respuestaIA });

        // 3. Mostrar la respuesta usando innerHTML para soportar el formato de Marked
        const botDiv = document.getElementById(id);
        if (typeof marked !== 'undefined') {
            botDiv.innerHTML = marked.parse(respuestaIA);
        } else {
            botDiv.innerText = respuestaIA;
        }

        setEstado("Listo");

    } catch (e) {
        document.getElementById(id).innerText = "Error de conexión";
        setEstado("Error", true);
    }
}

function agregarMensaje(texto, clase, id = null) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.className = "msg " + clase;
    
    // Si es mensaje del bot (tiene ID), ponemos el texto temporalmente
    div.innerText = texto; 
    
    if (id) div.id = id;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}