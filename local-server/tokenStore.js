const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "tokenStore.json");

let cachedTokens = null;

function readFromDisk() {
  if (!fs.existsSync(STORE_PATH)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn("[TokenStore] Failed to read token file:", error);
    return null;
  }
}

function writeToDisk(tokens) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(tokens, null, 2), "utf8");
  } catch (error) {
    console.warn("[TokenStore] Failed to write token file:", error);
  }
}

function getTokens() {
  if (cachedTokens) {
    return cachedTokens;
  }

  cachedTokens = readFromDisk();
  return cachedTokens;
}

function saveTokens(tokens) {
  cachedTokens = tokens || null;
  if (!tokens) {
    if (fs.existsSync(STORE_PATH)) {
      try {
        fs.unlinkSync(STORE_PATH);
      } catch (error) {
        console.warn("[TokenStore] Failed to remove token file:", error);
      }
    }
    return;
  }

  writeToDisk(tokens);
}

module.exports = {
  getTokens,
  saveTokens
};

