const LazadaAPI = require("lazada-open-platform-sdk/lib/LazadaAPI");

class LazadaApiClient {
  _appKey = undefined;
  _appSecret = undefined;
  _country = undefined;
  _client = undefined;

  constructor(appKey, appSecret, country) {
    this._appKey = appKey;
    this._appSecret = appSecret;
    this._country = country;
    this._client = new LazadaAPI(appKey, appSecret, country).client;
  }

  getAuthUrl(hostname) {
    const authUrl = new URL(`https://auth.lazada.com/oauth/authorize`);

    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("force_auth", "true");
    authUrl.searchParams.set("client_id", this._appKey);
    authUrl.searchParams.set(
      "redirect_uri",
      new URL(`https://${hostname}/callback/lazada`).toString()
    );

    return authUrl.toString();
  }

  exchangeCodeForTokens(code) {
    return this._client.generateAccessToken(
      this._appKey,
      this._appSecret,
      this._country,
      "",
      {
        code,
      }
    );
  }
}

module.exports = LazadaApiClient;
