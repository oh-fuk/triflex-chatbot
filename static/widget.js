(function () {
  const cfg = window.ChatbotConfig || {};
  const API = (cfg.apiUrl || "").replace(/\/$/, "");

  let botName = "Triflex Assistant";
  let welcomeMsg = "👋 Hi! I'm your Triflex Media assistant. I help businesses grow online. What can I help you with today?";
  let chatHistory = [];
  let isOpen = false;

  // ── CSS ─────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #cb-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #cb-widget { position: fixed; bottom: 24px; right: 24px; z-index: 999999; }

    #cb-toggle {
      width: 64px; height: 64px; border-radius: 0; border: none; cursor: pointer;
      background: transparent; box-shadow: none;
      display: flex; align-items: center; justify-content: center;
      margin-left: auto; padding: 0;
      animation: cbFloat 3s ease-in-out infinite;
    }
    #cb-toggle img {
      width: 64px; height: 64px; object-fit: contain;
      filter: drop-shadow(0 6px 16px rgba(124,58,237,0.5));
      transition: transform 0.2s, filter 0.2s;
    }
    #cb-toggle:hover img {
      transform: scale(1.1);
      filter: drop-shadow(0 8px 24px rgba(124,58,237,0.7));
    }
    @keyframes cbFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }

    #cb-box {
      width: 375px; height: 560px; background: #f8faff; border-radius: 18px;
      box-shadow: 0 12px 50px rgba(124,58,237,0.18);
      display: flex; flex-direction: column; overflow: hidden; margin-bottom: 12px;
      transform: scale(0.9) translateY(20px); opacity: 0; pointer-events: none;
      transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #cb-box.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

    #cb-header {
      background: linear-gradient(135deg, #0ea5e9, #7c3aed);
      color: white; padding: 1rem 1.1rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    #cb-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      overflow: hidden; flex-shrink: 0;
    }
    #cb-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    #cb-header-info { flex: 1; }
    #cb-bot-name { font-weight: 700; font-size: 0.95rem; }
    #cb-status { font-size: 0.72rem; opacity: 0.9; display: flex; align-items: center; gap: 4px; }
    #cb-status::before { content: ""; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; display: inline-block; }
    #cb-close { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; opacity: 0.8; padding: 4px; border-radius: 6px; }
    #cb-close:hover { opacity: 1; background: rgba(255,255,255,0.15); }

    #cb-messages {
      flex: 1; overflow-y: auto; padding: 1rem;
      display: flex; flex-direction: column; gap: 0.65rem; scroll-behavior: smooth;
    }
    #cb-messages::-webkit-scrollbar { width: 3px; }
    #cb-messages::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 4px; }

    .cb-msg {
      max-width: 83%; padding: 0.65rem 0.9rem; border-radius: 16px;
      font-size: 0.875rem; line-height: 1.55; word-break: break-word;
      animation: cbFadeIn 0.22s ease;
    }
    @keyframes cbFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .cb-msg.bot {
      background: white; color: #1e293b;
      border-bottom-left-radius: 4px; align-self: flex-start;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07);
    }
    .cb-msg.user {
      background: linear-gradient(135deg, #0ea5e9, #7c3aed);
      color: white; border-bottom-right-radius: 4px; align-self: flex-end;
      box-shadow: 0 2px 10px rgba(124,58,237,0.3);
    }

    .cb-typing { display: flex; gap: 4px; align-items: center; padding: 0.75rem 0.9rem; }
    .cb-typing span { width: 7px; height: 7px; background: #a78bfa; border-radius: 50%; animation: cbBounce 1.2s infinite; }
    .cb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cbBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

    #cb-footer {
      padding: 0.75rem; border-top: 1px solid #e8e4f8; background: white;
      display: flex; gap: 0.5rem; align-items: flex-end;
    }
    #cb-input {
      flex: 1; border: 2px solid #e2d9f3; border-radius: 12px;
      padding: 0.6rem 0.85rem; font-size: 0.875rem; outline: none;
      resize: none; max-height: 100px; line-height: 1.4;
      transition: border-color 0.2s; font-family: inherit; background: #faf8ff;
    }
    #cb-input:focus { border-color: #7c3aed; }
    #cb-send {
      width: 40px; height: 40px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #0ea5e9, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s, transform 0.1s; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(124,58,237,0.35);
    }
    #cb-send:hover { opacity: 0.9; transform: scale(1.05); }
    #cb-send svg { width: 18px; height: 18px; fill: white; }
    #cb-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    /* ── Welcome Quick Buttons ── */
    .cb-quick-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; align-self: flex-start; }
    .cb-quick-btn {
      padding: 0.35rem 0.8rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: 1.5px solid #7c3aed; color: #7c3aed; background: white;
      transition: all 0.2s; white-space: nowrap;
    }
    .cb-quick-btn:hover { background: linear-gradient(135deg, #0ea5e9, #7c3aed); color: white; border-color: transparent; }

    /* ── Cards ── */
    .cb-card { align-self: flex-start; width: 100%; max-width: 100%; animation: cbFadeIn 0.3s ease; }
    .cb-card-label { font-size: 0.8rem; color: #7c3aed; margin-bottom: 0.4rem; padding-left: 2px; font-weight: 600; }

    .cb-card-box {
      background: white; border: 1px solid #e8e4f8; border-radius: 14px;
      overflow: hidden; box-shadow: 0 2px 12px rgba(124,58,237,0.1);
    }
    .cb-card-head {
      background: linear-gradient(135deg, #0ea5e9, #7c3aed);
      color: white; padding: 0.65rem 1rem; font-weight: 700; font-size: 0.88rem;
    }
    .cb-card-body { padding: 0.75rem; }

    /* Contact */
    .cb-contact-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #334155; padding: 0.25rem 0; }
    .cb-contact-row span:first-child { font-size: 1rem; width: 22px; text-align: center; }
    .cb-contact-btns { display: flex; gap: 0.45rem; padding: 0 0.75rem 0.75rem; flex-wrap: wrap; }

    /* Buttons */
    .cb-btn {
      padding: 0.38rem 0.85rem; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: none; text-decoration: none;
      display: inline-flex; align-items: center; gap: 0.3rem; transition: opacity 0.2s, transform 0.1s;
    }
    .cb-btn:hover { opacity: 0.88; transform: scale(1.03); }
    .cb-btn-grad { background: linear-gradient(135deg, #0ea5e9, #7c3aed); color: white; }
    .cb-btn-green { background: #22c55e; color: white; }
    .cb-btn-outline { background: white; color: #7c3aed; border: 1.5px solid #7c3aed; }
    .cb-btn-fb { background: #1877f2; color: white; }
    .cb-btn-ig { background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); color: white; }
    .cb-btn-li { background: #0a66c2; color: white; }

    /* Social */
    .cb-social-btns { display: flex; gap: 0.45rem; padding: 0.75rem; flex-wrap: wrap; }

    /* Services */
    .cb-services-wrap { display: flex; flex-direction: column; gap: 0.35rem; }
    .cb-service-item {
      background: white; border: 1px solid #ede9fe; border-radius: 10px;
      padding: 0.55rem 0.8rem; display: flex; align-items: center; gap: 0.6rem;
      box-shadow: 0 1px 4px rgba(124,58,237,0.06);
    }
    .cb-service-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#38bdf8,#7c3aed); flex-shrink: 0; }
    .cb-service-name { font-size: 0.82rem; font-weight: 600; color: #1e293b; }
    .cb-service-desc { font-size: 0.74rem; color: #64748b; }

    /* Pricing */
    .cb-pricing-wrap { display: flex; flex-direction: column; gap: 0.45rem; }
    .cb-pricing-card {
      background: white; border: 1.5px solid #ede9fe; border-radius: 12px;
      padding: 0.8rem; box-shadow: 0 1px 6px rgba(124,58,237,0.07);
    }
    .cb-pricing-card.highlight { border-color: #7c3aed; background: #faf8ff; }
    .cb-pricing-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; }
    .cb-pricing-name { font-weight: 700; font-size: 0.88rem; color: #1e293b; }
    .cb-pricing-price { font-weight: 700; font-size: 0.9rem; background: linear-gradient(135deg,#0ea5e9,#7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cb-pricing-badge { font-size: 0.62rem; background: linear-gradient(135deg,#0ea5e9,#7c3aed); color: white; padding: 0.12rem 0.45rem; border-radius: 10px; margin-left: 0.4rem; -webkit-text-fill-color: white; }
    .cb-pricing-features { display: flex; flex-direction: column; gap: 0.18rem; }
    .cb-pricing-feat { font-size: 0.74rem; color: #475569; display: flex; align-items: center; gap: 0.4rem; }
    .cb-pricing-feat::before { content: "✓"; color: #22c55e; font-weight: 700; }

    /* Portfolio */
    .cb-portfolio-wrap { display: flex; flex-direction: column; gap: 0.35rem; }
    .cb-portfolio-item {
      background: white; border: 1px solid #ede9fe; border-radius: 10px;
      padding: 0.6rem 0.8rem; box-shadow: 0 1px 4px rgba(124,58,237,0.06);
    }
    .cb-portfolio-top { display: flex; justify-content: space-between; align-items: center; }
    .cb-portfolio-name { font-size: 0.82rem; font-weight: 600; color: #1e293b; }
    .cb-portfolio-type { font-size: 0.68rem; background: #ede9fe; color: #7c3aed; padding: 0.1rem 0.5rem; border-radius: 8px; font-weight: 600; }
    .cb-portfolio-result { font-size: 0.74rem; color: #16a34a; margin-top: 0.2rem; font-weight: 500; }

    @media (max-width: 420px) {
      #cb-box { width: calc(100vw - 32px); }
      #cb-widget { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────
  const widget = document.createElement("div");
  widget.id = "cb-widget";
  widget.innerHTML = `
    <div id="cb-box">
      <div id="cb-header">
        <div id="cb-avatar"><img src="${API}/static/bot-icon.png" alt="bot" onerror="this.parentNode.innerHTML='🤖'"></div>
        <div id="cb-header-info">
          <div id="cb-bot-name">Triflex Assistant</div>
          <div id="cb-status">Online — Ready to help</div>
        </div>
        <button id="cb-close" aria-label="Close">✕</button>
      </div>
      <div id="cb-messages" role="log" aria-live="polite"></div>
      <div id="cb-footer">
        <textarea id="cb-input" placeholder="Ask me anything..." rows="1" aria-label="Message"></textarea>
        <button id="cb-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
    </div>
    <button id="cb-toggle" aria-label="Open chat">
      <img src="${API}/static/bot-icon.png" alt="chat">
    </button>
  `;
  document.body.appendChild(widget);

  const box = document.getElementById("cb-box");
  const toggle = document.getElementById("cb-toggle");
  const closeBtn = document.getElementById("cb-close");
  const input = document.getElementById("cb-input");
  const sendBtn = document.getElementById("cb-send");
  const messages = document.getElementById("cb-messages");

  // ── Welcome message with quick buttons ──────────────────
  function showWelcome() {
    const msgDiv = document.createElement("div");
    msgDiv.className = "cb-msg bot";
    msgDiv.textContent = welcomeMsg;
    messages.appendChild(msgDiv);

    const btnsDiv = document.createElement("div");
    btnsDiv.className = "cb-quick-btns";
    const quickActions = [
      { label: "🚀 Our Services", msg: "show me your services" },
      { label: "✨ Portfolio", msg: "show me your portfolio" },
      { label: "📬 Contact Us", msg: "how can I contact you" },
    ];
    quickActions.forEach(({ label, msg }) => {
      const btn = document.createElement("button");
      btn.className = "cb-quick-btn";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        btnsDiv.remove();
        triggerMessage(msg);
      });
      btnsDiv.appendChild(btn);
    });
    messages.appendChild(btnsDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  fetch(API + "/api/config")
    .then(r => r.json())
    .then(data => {
      botName = data.bot_name || botName;
      welcomeMsg = data.welcome_message || welcomeMsg;
      document.getElementById("cb-bot-name").textContent = botName;
      showWelcome();
    })
    .catch(() => {
      document.getElementById("cb-bot-name").textContent = botName;
      showWelcome();
    });

  // ── Toggle ───────────────────────────────────────────────
  function openChat() {
    isOpen = true; box.classList.add("open");
    toggle.style.animation = "none";
    input.focus();
  }
  function closeChat() {
    isOpen = false; box.classList.remove("open");
    toggle.style.animation = "";
  }
  toggle.addEventListener("click", () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener("click", closeChat);

  // ── Card Renderers ───────────────────────────────────────
  function renderCard(parsed) {
    const wrap = document.createElement("div");
    wrap.className = "cb-card";

    if (parsed.text) {
      const lbl = document.createElement("div");
      lbl.className = "cb-card-label";
      lbl.textContent = parsed.text;
      wrap.appendChild(lbl);
    }

    if (parsed.type === "contact") {
      const d = parsed.data;
      const box = document.createElement("div");
      box.className = "cb-card-box";
      box.innerHTML = `
        <div class="cb-card-head">📬 Get In Touch</div>
        <div class="cb-card-body">
          <div class="cb-contact-row"><span>📧</span><span>${d.email}</span></div>
          <div class="cb-contact-row"><span>📞</span><span>${d.phone}</span></div>
          <div class="cb-contact-row"><span>📍</span><span>${d.address}</span></div>
          <div class="cb-contact-row"><span>⏱️</span><span>Replies ${d.response_time}</span></div>
        </div>
        <div class="cb-contact-btns">
          <a href="mailto:${d.email}" class="cb-btn cb-btn-grad">✉️ Email Us</a>
          <a href="https://wa.me/${d.whatsapp.replace(/\D/g, '')}" target="_blank" class="cb-btn cb-btn-green">💬 WhatsApp</a>
          <a href="tel:${d.phone}" class="cb-btn cb-btn-outline">📞 Call</a>
        </div>`;
      wrap.appendChild(box);
    }

    else if (parsed.type === "social") {
      const d = parsed.data;
      const box = document.createElement("div");
      box.className = "cb-card-box";
      box.innerHTML = `
        <div class="cb-card-head">🌐 Follow Triflex Media</div>
        <div class="cb-social-btns">
          <a href="${d.facebook}" target="_blank" class="cb-btn cb-btn-fb">👍 Facebook</a>
          <a href="${d.instagram}" target="_blank" class="cb-btn cb-btn-ig">📸 Instagram</a>
          <a href="${d.linkedin}" target="_blank" class="cb-btn cb-btn-li">💼 LinkedIn</a>
        </div>`;
      wrap.appendChild(box);
    }

    else if (parsed.type === "services") {
      const lbl2 = document.createElement("div");
      lbl2.className = "cb-services-wrap";
      lbl2.innerHTML = parsed.data.map(s => `
        <div class="cb-service-item">
          <div class="cb-service-dot"></div>
          <div>
            <div class="cb-service-name">${s.name}</div>
            <div class="cb-service-desc">${s.desc}</div>
          </div>
        </div>`).join("");
      wrap.appendChild(lbl2);
    }

    else if (parsed.type === "pricing") {
      const pw = document.createElement("div");
      pw.className = "cb-pricing-wrap";
      pw.innerHTML = parsed.data.map(p => `
        <div class="cb-pricing-card ${p.highlight ? 'highlight' : ''}">
          <div class="cb-pricing-top">
            <div class="cb-pricing-name">${p.name}${p.highlight ? '<span class="cb-pricing-badge">Most Popular</span>' : ''}</div>
            <div class="cb-pricing-price">${p.price}</div>
          </div>
          <div class="cb-pricing-features">
            ${p.features.map(f => `<div class="cb-pricing-feat">${f}</div>`).join("")}
          </div>
        </div>`).join("");
      wrap.appendChild(pw);
    }

    else if (parsed.type === "portfolio") {
      const pw = document.createElement("div");
      pw.className = "cb-portfolio-wrap";
      pw.innerHTML = parsed.data.map(p => `
        <div class="cb-portfolio-item">
          <div class="cb-portfolio-top">
            <div class="cb-portfolio-name">${p.name}</div>
            <div class="cb-portfolio-type">${p.type}</div>
          </div>
          <div class="cb-portfolio-result">✅ ${p.result}</div>
        </div>`).join("");
      wrap.appendChild(pw);
    }

    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function formatText(text) {
    // Escape HTML first
    let t = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Bold: *text* or **text**
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.+?)\*/g, "<strong>$1</strong>");
    // Bullet points: lines starting with • or - or *
    const lines = t.split("\n");
    let html = "", inList = false;
    for (let line of lines) {
      line = line.trim();
      if (!line) { if (inList) { html += "</ul>"; inList = false; } html += "<br>"; continue; }
      if (/^[•\-]\s/.test(line)) {
        if (!inList) { html += '<ul style="margin:0.3rem 0 0.3rem 1rem;padding:0;list-style:none;">'; inList = true; }
        html += `<li style="margin:0.2rem 0;display:flex;gap:0.4rem;align-items:flex-start;"><span style="color:#7c3aed;font-weight:700;flex-shrink:0;">•</span><span>${line.replace(/^[•\-]\s/, "")}</span></li>`;
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        html += `<p style="margin:0.2rem 0;">${line}</p>`;
      }
    }
    if (inList) html += "</ul>";
    return html;
  }

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = "cb-msg " + role;
    if (role === "bot") {
      div.innerHTML = formatText(text);
    } else {
      div.textContent = text;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "cb-msg bot cb-typing"; div.id = "cb-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  function removeTyping() { const t = document.getElementById("cb-typing"); if (t) t.remove(); }

  // ── Core send logic ──────────────────────────────────────
  async function triggerMessage(text) {
    addMessage("user", text);
    chatHistory.push({ role: "user", content: text });
    showTyping();
    await streamResponse(text);
  }

  async function streamResponse(text) {
    try {
      const res = await fetch(API + "/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory.slice(-10) })
      });

      removeTyping();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullReply = "", msgDiv = null, isCard = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) {
              removeTyping();
              const errDiv = addMessage("bot", "");
              errDiv.innerHTML = `<span style="color:#ef4444;">⚠️ ${parsed.error}</span>`;
              break;
            }
            if (parsed.chunk) {
              fullReply += parsed.chunk;
              if (fullReply.trim().startsWith("{")) {
                isCard = true;
              } else {
                isCard = false;
                if (!msgDiv) msgDiv = addMessage("bot", "");
                msgDiv.innerHTML = formatText(fullReply);
                messages.scrollTop = messages.scrollHeight;
              }
            }
          } catch { }
        }
      }

      if (isCard && fullReply.trim().startsWith("{")) {
        try {
          const cardData = JSON.parse(fullReply.trim());
          if (cardData.type === "mixed") {
            // Text + card together
            if (msgDiv) msgDiv.remove();
            if (cardData.text_response) addMessage("bot", cardData.text_response);
            if (cardData.card) renderCard(cardData.card);
          } else if (cardData.type) {
            if (msgDiv) msgDiv.remove();
            renderCard(cardData);
          } else {
            if (!msgDiv) addMessage("bot", fullReply);
          }
        } catch {
          if (!msgDiv) addMessage("bot", fullReply);
          else msgDiv.innerHTML = formatText(fullReply);
        }
      }

      if (fullReply) chatHistory.push({ role: "model", content: fullReply });

    } catch (err) {
      removeTyping();
      addMessage("bot", "⚠️ Connection error. Make sure the server is running.");
    }
    sendBtn.disabled = false;
    input.focus();
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = ""; input.style.height = "auto";
    sendBtn.disabled = true;
    await triggerMessage(text);
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });
})();
