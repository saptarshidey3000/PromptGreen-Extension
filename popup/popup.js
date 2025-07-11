document.getElementById("optimizeBtn").addEventListener("click", async () => {
  const prompt = document.getElementById("userPrompt").value;

  if (!prompt) {
    alert("Please enter a prompt.");
    return;
  }

  
  try {
   
    const response = await fetch("https://your-backend-api.com/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    document.getElementById("result").innerHTML = `
      <strong>Optimized:</strong><br>${data.optimizedPrompt}<br>
      <strong>Tokens Saved:</strong> ${data.tokensSaved}<br>
      <strong>CO₂ Reduced:</strong> ${data.co2Reduced}g
    `;
  } catch (error) {
    console.error("API call failed:", error);
    document.getElementById("result").innerHTML = `<p style="color:red;">API not connected. Try again later.</p>`;
  }
});
