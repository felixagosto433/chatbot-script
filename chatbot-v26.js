// Adapted chatbot-v25.js with advanced enhancements
window.addEventListener('load', function () {
  const DEBUG = true;
  function log(...args) {
    if (DEBUG) console.log('🤖 Chatbot:', ...args);
  }
  function error(...args) {
    if (DEBUG) console.error('🔥 Chatbot Error:', ...args);
  }

  log("✅ Chatbot script loaded");

  (function () {
    function createEl(tag, attrs, text) {
      const el = document.createElement(tag);
      if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (text) el.textContent = text;
      return el;
    }

    function getUserId() {
      let uid = localStorage.getItem("chat_user_id");
      if (!uid) {
        uid = crypto.randomUUID();
        localStorage.setItem("chat_user_id", uid);
      }
      return uid;
    }

    const style = createEl("style");
    document.head.appendChild(style);

    const container = createEl("div", { id: "chatbot-container" });
    const messages = createEl("div", { id: "chatbot-messages" });
    const inputContainer = createEl("div", { id: "chatbot-input-container" });
    const input = createEl("input", {
      id: "chatbot-input",
      placeholder: "Hazme una pregunta..."
    });
    const sendBtn = createEl("button", { id: "chatbot-send" }, "Enviar");
    inputContainer.appendChild(input);
    inputContainer.appendChild(sendBtn);
    container.appendChild(messages);
    container.appendChild(inputContainer);
    document.body.appendChild(container);
    const toggle = createEl("button", { id: "chatbot-toggle" }, "💬");
    document.body.appendChild(toggle);

    function addMessage(content, className) {
      const wrapper = createEl("div", {
        class: className === "user-message" ? "message-wrapper user" : "message-wrapper bot"
      });
      const msg = createEl("div", { class: className });
      msg.innerHTML = content;
      wrapper.appendChild(msg);
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
      return msg;
    }

    function addOptions(options) {
      const wrapper = createEl("div", { class: "bot-options" });
      options.forEach((option, index) => {
        const btn = createEl("button", {
          class: "bot-option-button",
          style: `animation-delay: ${index * 100}ms;`
        }, option);
        btn.onclick = () => {
          wrapper.querySelectorAll("button").forEach(b => b.disabled = true);
          wrapper.remove();
          sendBotMessage(option);
        };
        wrapper.appendChild(btn);
      });
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTypingIndicator() {
      const wrapper = createEl("div", { class: "message-wrapper bot" });
      const indicator = createEl("div", { class: "typing-indicator" });
      indicator.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
      wrapper.appendChild(indicator);
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
      return wrapper;
    }

    function removeTypingIndicator(indicator) {
      if (indicator && indicator.remove) indicator.remove();
    }

    async function callApi(message, userId) {
      try {
        const response = await fetch("https://production-goshop-d116fe7863dc.herokuapp.com/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Version": "1.0.0",
            "X-Request-ID": crypto.randomUUID()
          },
          body: JSON.stringify({
            message,
            user_id: userId,
            client_timestamp: new Date().toISOString()
          })
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (err) {
        error("API Call Failed:", err);
        throw err;
      }
    }

    function sendBotMessage(userMessage) {
      addMessage(userMessage, "user-message");
      const typingIndicator = showTypingIndicator();
      input.disabled = true;
      sendBtn.disabled = true;

      callApi(userMessage, getUserId())
        .then(data => {
          removeTypingIndicator(typingIndicator);
          const botText = data.text?.trim() || "🤖 No entendí eso, ¿puedes intentarlo de otra forma?";
          const products = Array.isArray(data.products) ? data.products : [];
          const options = Array.isArray(data.options) ? data.options : [];

          addMessage(botText, "bot-message");

          if (products.length > 0) {
            const formatted = products.map(item => `
              <div style="margin-bottom: 12px;">
                <b>🟢 ${item.name}</b> - 💲${item.price}<br>
                <b>🏷️ Categoría:</b> ${item.category}<br>
                <b>📝 Descripción:</b> ${item.description}<br>
                <b>💊 Uso:</b> ${item.usage}<br>
                <a href="${item.link}" target="_blank">🔗 Ver producto</a>
              </div>
            `).join("");
            addMessage(formatted, "bot-message");
          }

          if (options.length > 0) {
            addOptions(options);
          }

          input.disabled = false;
          sendBtn.disabled = false;
        })
        .catch(err => {
          removeTypingIndicator(typingIndicator);
          addMessage("⚠️ Lo siento, ocurrió un error en el servidor. Inténtalo de nuevo.", "bot-message");
          input.disabled = false;
          sendBtn.disabled = false;
        });
    }

    function sendMessage() {
      const userMessage = input.value.trim();
      if (!userMessage) return;
      sendBotMessage(userMessage);
      input.value = "";
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") sendMessage();
    });

    toggle.addEventListener("click", () => {
      container.classList.toggle("visible");
      if (!window.__chatbotInitialized) {
        callApi("__init__", getUserId())
          .then(data => {
            if (data.text) addMessage(data.text, "bot-message");
            if (data.options?.length) addOptions(data.options);
          })
          .catch(err => {
            error("Initial chat trigger failed:", err);
            addMessage("Bot: Hola 👋 Pero no pude conectarme al servidor.", "bot-message");
          });
        window.__chatbotInitialized = true;
      }
    });
  })();
});
