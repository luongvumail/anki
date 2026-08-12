/**
 * Cloudflare Worker Proxy for Gemini AI
 * Protects GEMINI_API_KEY by hiding it behind an Edge Worker.
 * Supports both ES Module (`export default`) and Service Worker (`addEventListener`) formats.
 */

async function callGeminiWithRetry(url, payload, maxRetries = 2) {
  let lastResponse = null;
  for (let i = 0; i <= maxRetries; i++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 429 || response.status === 503) {
      lastResponse = response;
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Backoff: 1s, 2s
        continue;
      }
    }
    return response;
  }
  return (
    lastResponse ||
    new Response(JSON.stringify({ error: "Gemini service unavailable after retries" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  );
}

async function handleWorkerRequest(request, env) {
  // Safe environment variable resolution (works in both Module & Service Worker modes)
  const geminiApiKey = env?.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== "undefined" ? GEMINI_API_KEY : "");
  const appSecret = env?.APP_SECRET || (typeof APP_SECRET !== "undefined" ? APP_SECRET : "");

  // 1. Handle CORS Preflight (OPTIONS request)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
      },
    });
  }

  // 2. Handle GET requests (Health Check / Cloudflare Editor Preview)
  if (request.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", message: "Anki Gemini Proxy is online & active!" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // 3. Validate App Token (Security Guard)
  if (appSecret) {
    const clientToken = request.headers.get("X-App-Token");
    if (clientToken !== appSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }

  // 4. Parse Request Payload
  try {
    const body = await request.json();
    const {
      model = "gemini-3.5-flash",
      prompt,
      inlineData,
      responseMimeType,
      temperature = 0.1,
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Server missing GEMINI_API_KEY secret" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 5. Build Gemini API REST Request (Supports text + multimodal inlineData)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const generationConfig = { temperature };
    if (responseMimeType) {
      generationConfig.responseMimeType = responseMimeType;
    }

    const parts = [];
    if (inlineData && inlineData.mimeType && inlineData.data) {
      parts.push({
        inlineData: {
          mimeType: inlineData.mimeType,
          data: inlineData.data,
        },
      });
    }
    parts.push({ text: prompt });

    const geminiPayload = {
      contents: [{ parts }],
      generationConfig,
    };

    // 6. Call Gemini REST API with retry on 429/503
    const response = await callGeminiWithRetry(geminiUrl, geminiPayload, 2);
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Gemini API error" }), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Extract generated text from candidates
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to process request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// ES Module Format Export (Modern Cloudflare Workers)
export default {
  async fetch(request, env, ctx) {
    return handleWorkerRequest(request, env);
  },
};

// Service Worker Format Polyfill (Legacy Cloudflare Workers compatibility)
if (typeof addEventListener !== "undefined") {
  addEventListener("fetch", (event) => {
    event.respondWith(handleWorkerRequest(event.request, globalThis));
  });
}
