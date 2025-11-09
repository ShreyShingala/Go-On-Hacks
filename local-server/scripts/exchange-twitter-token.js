const fetch = (...args) =>
  import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));

const [clientId, clientSecret, code, codeVerifier, redirectUri] = process.argv.slice(2);

if (!clientId || !clientSecret || !code || !codeVerifier || !redirectUri) {
  console.error(
    'Usage: npm run twitter:exchange -- "CLIENT_ID" "CLIENT_SECRET" "CODE" "CODE_VERIFIER" "https://your-callback-url"'
  );
  process.exit(1);
}

async function main() {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("❌ Token exchange failed:", response.status, response.statusText);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("✅ Token exchange succeeded. Save these securely:");
  console.log(JSON.stringify(data, null, 2));
  console.log("\nUse access_token as TWITTER_BEARER_TOKEN in local-server/.env.");
}

main().catch((error) => {
  console.error("Unexpected error exchanging token:", error);
  process.exit(1);
});

