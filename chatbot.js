window.addEventListener('load', function () {
  console.log("✅ Chatbot script loaded");

  (function () {
    function createEl(tag, attrs, text) {
      const el = document.createElement(tag);
      if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
      if (text) el.textContent = text;
      return el;
    }

    // Inject styles
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
        width: 320px;
        max-height: 500px;
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
        font-weight: bold;
        margin-bottom: 5px;
      }

      .bot-message {
        margin-bottom: 10px;
        white-space: pre-wrap;
      }

      .bot-message a {
        color: #4CAF50;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);

    // Build chatbot interface
    const container = createEl("div", { id: "chatbot-container" });
    const messages = createEl("div", { id: "chatbot-messages" });
    const inputContainer = createEl("div", { id: "chatbot-input-container" });
    const input = createEl("input", {
      id: "chatbot-input",
      placeholder: "Ask me anything..."
    });
    const sendBtn = createEl("button", { id: "chatbot-send" }, "Send");

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendBtn);
    container.appendChild(messages);
    container.appendChild(inputContainer);
    document.body.appendChild(container);

    const toggle = createEl("button", { id: "chatbot-toggle" }, "💬");
    document.body.appendChild(toggle);

    toggle.addEventListener("click", () => {
      container.style.display =
        container.style.display === "none" || container.style.display === ""
          ? "flex"
          : "none";
    });

    function addMessage(content, className) {
      const msg = createEl("div", { class: className });
      msg.innerHTML = content;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage() {
      const userMessage = input.value.trim();
      if (!userMessage) return;

      addMessage("You: " + userMessage, "user-message");
      input.value = "";

      fetch("https://vast-escarpment-05453-5a02b964d113.herokuapp.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      })
        .then(res => res.json())
        .then(data => {
          console.log("🧪 Received from backend:", data);

          const supplements = data.response || [];

          if (!Array.isArray(supplements) || supplements.length === 0) {
            addMessage("Bot: No supplements found for your query.", "bot-message");
            return;
          }

          const formatted = supplements.map(item => {
            if (typeof item === "object") {
              return `
<b>${item.name}</b> - $${item.price}<br>
<b>Categoría:</b> ${item.category}<br>
<b>Descripción:</b> ${item.description}<br>
<b>Uso:</b> ${item.usage}<br>
<a href="${item.link}" target="_blank">Ver producto</a>
              `.trim();
            } else {
              return item;
            }
          }).join("<br><br>");

          addMessage("Bot:<br>" + formatted, "bot-message");
        })
        .catch(err => {
          console.error("🔥 Fetch failed:", err);
          addMessage("Bot: Sorry, something went wrong.", "bot-message");
        });
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") sendMessage();
    });
  })();
});
