// import fetch from "node-fetch";

// const aiUsage = {}; // demo rate limit

// export const analyzeSymptoms = async (req, res) => {
//   try {
//     const { symptoms } = req.body;
//     const userId = req.userId;

//     if (!symptoms) {
//       return res.status(400).json({
//         success: false,
//         message: "Symptoms are required",
//       });
//     }

//     // -------- RATE LIMIT (5/day) --------
//     const today = new Date().toDateString();
//     if (!aiUsage[userId] || aiUsage[userId].date !== today) {
//       aiUsage[userId] = { count: 0, date: today };
//     }

//     if (aiUsage[userId].count >= 5) {
//       return res.status(429).json({
//         success: false,
//         message: "Daily AI limit reached",
//       });
//     }

//     aiUsage[userId].count++;

//     // -------- OPENAI CALL --------
//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       },
//       body: JSON.stringify({
//         model: "gpt-3.5-turbo",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are a medical assistant. Do NOT give diagnosis. Only suggest doctor type and urgency.",
//           },
//           {
//             role: "user",
//             content: `
// Symptoms: ${symptoms}

// Respond ONLY in JSON:
// {
//   "specialization": "",
//   "urgency": "Low | Medium | High",
//   "advice": ""
// }
//             `,
//           },
//         ],
//         temperature: 0.2,
//       }),
//     });

//     const data = await response.json();
//     const aiResult = JSON.parse(data.choices[0].message.content);

//     res.status(200).json({
//       success: true,
//       data: aiResult,
//     });
//   } catch (error) {
//     console.error("AI ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: "AI service failed",
//     });
//   }
// };
