// এই ফাইলটা সার্ভারে চলে, ব্রাউজারে না — তাই এখানে রাখা API key কখনো
// ব্যবহারকারীর সামনে প্রকাশ হয় না।

exports.handler = async function (event) {
  try {
    var apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log("ERROR: GEMINI_API_KEY is missing");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY সেট করা নেই" })
      };
    }

    var body = event.body ? JSON.parse(event.body) : {};
    var level = body.level || 1;
    var count = body.count || 5;

    var prompt = "Generate " + count + " multiple choice trivia quiz questions in Bengali, difficulty level " + level + " of 10 (higher = harder), general knowledge. Respond ONLY with a JSON array, no markdown, no preamble, in this exact shape: [{\"q\":\"question text in Bengali\",\"opts\":[\"a\",\"b\",\"c\",\"d\"],\"ans\":0}] where ans is the correct option 0-based index.";

    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    console.log("Gemini HTTP status:", res.status);

    var data = await res.json();
    console.log("Gemini raw response:", JSON.stringify(data).slice(0, 1500));

    if (data.error) {
      console.log("Gemini API returned an error:", JSON.stringify(data.error));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error })
      };
    }

    var text = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      text = data.candidates[0].content.parts[0].text || "";
    }
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    var parsed = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    console.log("CAUGHT ERROR:", String(err));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};

