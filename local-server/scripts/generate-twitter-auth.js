const crypto = require("crypto");

const clientId = process.argv[2];
const redirectUri = process.argv[3];
const clientSecret = process.argv[4];

if (!clientId || !redirectUri) {
  console.error(
    'Usage: npm run twitter:authhelper -- "CLIENT_ID" "https://your-callback-url" ["CLIENT_SECRET"]'
  );
  process.exit(1);
}

const codeVerifier = crypto.randomBytes(32).toString("base64url");
const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
const state = crypto.randomBytes(16).toString("hex");

const authorizeUrl = new URL("https://twitter.com/i/oauth2/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("redirect_uri", redirectUri);
authorizeUrl.searchParams.set("scope", "tweet.read tweet.write users.read offline.access");
authorizeUrl.searchParams.set("state", state);
authorizeUrl.searchParams.set("code_challenge", codeChallenge);
authorizeUrl.searchParams.set("code_challenge_method", "S256");

console.log("=== Twitter OAuth 2.0 PKCE Helper ===");
console.log("Step 1: Visit this URL in your browser, log in, and approve the app:\n");
console.log(authorizeUrl.href);
console.log("\nKeep this window open. After authorization you'll be redirected to your callback URL with ?code=...&state=...");
console.log(`State we generated (for validation): ${state}\n`);
console.log("Step 2: Exchange the returned code with this curl command (replace THE_CODE):\n");

const baseCurl = [
  "curl -X POST https://api.twitter.com/2/oauth2/token",
  '-H "Content-Type: application/x-www-form-urlencoded"',
  `-d "client_id=${clientId}"`,
  '-d "grant_type=authorization_code"',
  '-d "code=THE_CODE"',
  `-d "redirect_uri=${redirectUri}"`,
  `-d "code_verifier=${codeVerifier}"`
];

if (clientSecret) {
  baseCurl.unshift(`curl -u "${clientId}:${clientSecret}" -X POST https://api.twitter.com/2/oauth2/token`);
  console.log(
    `curl -u "${clientId}:${clientSecret}" -X POST https://api.twitter.com/2/oauth2/token ` +
      '-H "Content-Type: application/x-www-form-urlencoded" ' +
      `-d "client_id=${clientId}" ` +
      '-d "grant_type=authorization_code" ' +
      '-d "code=THE_CODE" ' +
      `-d "redirect_uri=${redirectUri}" ` +
      `-d "code_verifier=${codeVerifier}"\n`
  );
} else {
  console.log(
    `curl -X POST https://api.twitter.com/2/oauth2/token ` +
      '-H "Content-Type: application/x-www-form-urlencoded" ' +
      `-d "client_id=${clientId}" ` +
      '-d "grant_type=authorization_code" ' +
      '-d "code=THE_CODE" ' +
      `-d "redirect_uri=${redirectUri}" ` +
      `-d "code_verifier=${codeVerifier}"\n`
  );
}

console.log(
  "The response JSON will contain access_token and refresh_token. Use access_token as TWITTER_BEARER_TOKEN."
);

