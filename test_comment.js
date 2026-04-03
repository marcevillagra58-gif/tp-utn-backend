const test = async () => {
  const response = await fetch("https://tp-utn-backend.vercel.app/api/producers/69cee1dfbde7708cb5806c4a/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "Marcelo_REAL_TEST",
      text: "Probando API remota"
    })
  });
  const data = await response.json();
  console.log("STATUS:", response.status);
  console.log("BODY:", data);
};
test();
