window.addEventListener('load', function () {
  console.log("✅ Chatbot script loaded");
  (function () {
    function createEl(tag, attrs, text) {
      var el = document.createElement(tag);
      if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]);
      if (text) el.textContent = text;
      return el;
    }

    var style = createEl("style");
    style.textContent = "" +
      "#chatbot-toggle{position:fixed;bottom:20px;right:20px;z-index:9999;background:#4CAF50;color:white;border:none;border-radius:50%;width:60px;height:60px;font-size:30px;cursor:pointer;}" +
      "#chatbot-container{position:fixed;bottom:90px;right:20px;width:300px;max-height:400px;background:white;border:1px solid #ccc;border-radius:10px;display:none;flex-direction:column;z-index:9998;font-family:Arial,sans-serif;}" +
      "#chatbot-messages{flex:1;overflow-y:auto;padding:10px;font-size:14px;}" +
      "#chatbot-input-container{display:flex;border-top:1px solid #ccc;}" +
      "#chatbot-input{flex:1;border:none;padding:10px;}" +
      "#chatbot-send{background:#4CAF50;color:white;border:none;padding:10px;cursor:pointer;}" +
      ".user-message{font-weight:bold;margin-bottom:5px;}" +
      ".bot-message{margin-bottom:10px;}";
    document.head.appendChild(style);

    var container = createEl("div", { id: "chatbot-container" });
    var messages = createEl("div", { id: "chatbot-messages" });
    var inputContainer = createEl("div", { id: "chatbot-input-container" });
    var input = createEl("input", { id: "chatbot-input", placeholder: "Ask me anything..." });
    var sendBtn = createEl("button", { id: "chatbot-send" }, "Send");

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendBtn);
    container.appendChild(messages);
    container.appendChild(inputContainer);
    document.body.appendChild(container);

    var toggle = createEl("button", { id: "chatbot-toggle" }, "💬");
    document.body.appendChild(toggle);

    toggle.addEventListener("click", function () {
      container.style.display = container.style.display === "none" || container.style.display === "" ? "flex" : "none";
    });

    function addMessage(content, className) {
      var msg = createEl("div", { class: className }, content);
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function sendMessage() {
      var userMessage = input.value.trim();
      if (!userMessage) return;

      addMessage("You: " + userMessage, "user-message");
      input.value = "";

      fetch("https://vast-escarpment-05453-5a02b964d113.herokuapp.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var replies = data.response || ["Sorry, I couldn't understand that."];
          var formattedReply = Array.isArray(replies) ? replies.join("\n\n") : replies;
          addMessage("Bot: " + formattedReply, "bot-message");
        })
        .catch(function () {
          addMessage("Bot: Sorry, something went wrong.", "bot-message");
        });
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") sendMessage();
    });
  })();
});
