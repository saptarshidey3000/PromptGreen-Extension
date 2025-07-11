const interval = setInterval(() => {
  const textarea = document.querySelector("textarea");

  if (textarea && !document.querySelector("#promptgreen-btn")) {
    const btn = document.createElement("button");
    btn.innerText = "🌱 Optimize";
    btn.id = "promptgreen-btn";
    btn.style.margin = "10px";
    btn.style.padding = "6px";
    btn.style.backgroundColor = "#10b981";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";

    btn.onclick = async () => {
      const prompt = textarea.value;

      try {
   
        const response = await fetch("https://your-backend-api.com/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        textarea.value = data.optimizedPrompt;
        alert(`Prompt optimized! CO₂ Saved: ${data.co2Reduced}g`);
      } catch (err) {
        alert("Optimization failed: Backend not connected.");
      }
    };

    textarea.parentElement.appendChild(btn);
  }
}, 3000);
