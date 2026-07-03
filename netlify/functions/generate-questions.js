// এই ফাইলটা সার্ভারে চলে, ব্রাউজারে না — তাই এখানে রাখা API key কখনো
// ব্যবহারকারীর সামনে প্রকাশ হয় না।

exports.handler = async function (event) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY সেট করা নেই (Netlify environment variables দেখুন)" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const level = body.level || 1;
    const count = body.count || 5;

    const prompt = `Generate ${count} multiple choice trivia quiz questions in Bengali (বাংলা), difficulty level ${level} of 10 (higher = harder), general knowledge. Respond ONLY with a JSON array, no markdown, no preamble, in this exact shape: [{"q":"question text in Bengali","opts":["a","b","c","d"],"ans":0}] where "ans" is the correct option's 0-based index.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
