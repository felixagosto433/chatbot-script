window.addEventListener('load', function () {
  console.log("✅ Chatbot script loaded");

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
    style.textContent = `
      #chatbot-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 30px;
        cursor: pointer;
      }

      #chatbot-container {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 90vw;
        max-width: 400px;
        max-height: 70vh;
        background: white;
        border: 1px solid #ccc;
        border-radius: 10px;
        display: none;
        flex-direction: column;
        z-index: 9998;
        font-family: Arial, sans-serif;
      }

      #chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        font-size: 14px;
      }

      #chatbot-input-container {
        display: flex;
        border-top: 1px solid #ccc;
      }

      #chatbot-input {
        flex: 1;
        border: none;
        padding: 10px;
      }

      #chatbot-send {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px;
        cursor: pointer;
      }

      .user-message {
        font-weight: normal;
        margin-bottom: 10px;
        padding: 10px;
        background: #e6f7ff;
        border-radius: 12px;
        border: 1px solid #b3e0ff;
        max-width: 80%;
        align-self: flex-end;
        text-align: right;
      }

      .bot-message {
        margin-bottom: 10px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 12px;
        border: 1px solid #ddd;
        max-width: 80%;
        align-self: flex-start;
        text-align: left;
      }

      .bot-message a {
        color: #4CAF50;
        text-decoration: underline;
      }

      .bot-options {
        margin-bottom: 10px;
      }

      .bot-option-button {
        display: inline-block;
        margin: 3px 5px;
        padding: 6px 10px;
        font-size: 13px;
        border: 2px solid #4CAF50;
        background: #ffffff;
        color: #000000;
        border-radius: 5px;
        cursor: pointer;
      }

      .typing-indicator {
        font-style: italic;
        color: #888;
        margin-bottom: 10px;
      }
      
      .message-wrapper {
        display: flex;
        margin-bottom: 8px;
      }
  
      .message-wrapper.bot {
        justify-content: flex-start;
      }
  
      .message-wrapper.user {
        justify-content: flex-end;
      }
    `;
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
      options.forEach(option => {
        const btn = createEl("button", { class: "bot-option-button" }, option);
        btn.onclick = () => {
          wrapper.remove(); // Remove buttons once clicked
          sendBotMessage(option); // Reuse the same flow
        };
        wrapper.appendChild(btn);
      });
      messages.appendChild(wrapper);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTypingIndicator() {
      return addMessage("Bot está escribiendo...", "typing-indicator");
    }

    function removeTypingIndicator(indicator) {
      if (indicator && indicator.remove) indicator.remove();
    }

    // 🧠 Replace hardcoded welcome with real bot response from backend
    fetch("https://vast-escarpment-05453-5a02b964d113.herokuapp.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "",
        user_id: getUserId()
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.text) addMessage("💊" + data.text, "bot-message");
        if (data.options?.length) addOptions(data.options);
      })
      .catch(err => {
        console.error("🔥 Initial chat trigger failed:", err);
        addMessage("Bot: Hola 👋 Pero no pude conectarme al servidor.", "bot-message");
      });

    toggle.addEventListener("click", () => {
      container.style.display =
        container.style.display === "none" || container.style.display === ""
          ? "flex"
          : "none";
    });

    function sendBotMessage(userMessage) {
      addMessage(userMessage, "user-message");

      const typingIndicator = showTypingIndicator();
      input.value = "";

      fetch("https://vast-escarpment-05453-5a02b964d113.herokuapp.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          user_id: getUserId()
        })
      })
        .then(res => res.json())
        .then(data => {
          removeTypingIndicator(typingIndicator);

          const botText = data.text || "🤖 No se recibió respuesta.";
          const products = data.products || [];
          const options = data.options || [];

          addMessage("💊" + botText, "bot-message");

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
        })
        .catch(err => {
          removeTypingIndicator(typingIndicator);
          console.error("🔥 Fetch failed:", err);
          addMessage("Bot: Lo siento, ocurrió un error.", "bot-message");
        });
    }

    function sendMessage() {
      const userMessage = input.value.trim();
      if (!userMessage) return;
      sendBotMessage(userMessage);
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") sendMessage();
    });
  })();
});
