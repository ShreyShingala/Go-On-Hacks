const fetch = (...args) =>
  import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));

const TWITTER_API_URL = "https://api.twitter.com/2/tweets";
const MAX_TWEET_LENGTH = 280;

function getToken() {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    throw new Error(
      "Missing TWITTER_BEARER_TOKEN. Set it in local-server/.env before posting to Twitter."
    );
  }
  return token;
}

function sanitizeTweet(text = "") {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot post an empty tweet.");
  }

  if (trimmed.length > MAX_TWEET_LENGTH) {
    return `${trimmed.slice(0, MAX_TWEET_LENGTH - 1)}…`;
  }

  return trimmed;
}

async function postTweet(text) {
  const token = getToken();
  const body = { text: sanitizeTweet(text) };

  const response = await fetch(TWITTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      responseBody?.error ||
      responseBody?.detail ||
      response.statusText ||
      "Unknown error posting tweet.";

    const rateRemaining = response.headers.get("x-rate-limit-remaining");
    const rateReset = response.headers.get("x-rate-limit-reset");

    const extra =
      rateRemaining !== null
        ? ` (Remaining: ${rateRemaining}${rateReset ? `, resets at ${new Date(
            Number(rateReset) * 1000
          ).toLocaleTimeString()}` : ""})`
        : "";

    throw new Error(`Twitter API error ${response.status}: ${errorMessage}${extra}`);
  }

  return {
    id: responseBody?.data?.id,
    text: responseBody?.data?.text
  };
}

module.exports = {
  postTweet
};

