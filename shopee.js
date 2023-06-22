const crypto = require("crypto");

class ShopeeApiClient {
  _partnerId = undefined;
  _partnerKey = undefined;
  _isSandbox = undefined;

  constructor(partnerId, partnerKey, isSandbox) {
    this._partnerId = parseInt(partnerId);
    this._partnerKey = partnerKey;
    this._isSandbox = !!isSandbox;
  }

  getAuthUrl(hostname) {
    const authUrl = new URL(`${this.getBaseUrl()}/api/v2/shop/auth_partner`);
    const timestamp = this.getCurrentTimestamp();

    authUrl.searchParams.set("partner_id", this._partnerId);
    authUrl.searchParams.set("timestamp", timestamp);
    authUrl.searchParams.set(
      "sign",
      this.getSignature(authUrl.pathname, timestamp)
    );
    authUrl.searchParams.set(
      "redirect",
      new URL(`https://${hostname}/oauth/callback/shopee`).toString()
    );

    return authUrl.toString();
  }

  exchangeCodeForTokens(code, sellerId, type) {
    const url = new URL(`${this.getBaseUrl()}/api/v2/auth/token/get`);
    const timestamp = this.getCurrentTimestamp();

    url.searchParams.set("sign", this.getSignature(url.pathname, timestamp));
    url.searchParams.set("timestamp", timestamp);
    url.searchParams.set("partner_id", this._partnerId);

    const reqBody = {
      code,
      partner_id: this._partnerId,
    };

    if (type === "shop_id") {
      reqBody.shop_id = parseInt(sellerId);
    } else if (type === "main_account_id") {
      reqBody.main_account_id = parseInt(sellerId);
    } else {
      throw new Error(`Unsupported seller type: '${type}'`);
    }

    return fetch(url.toString(), {
      method: "POST",
      body: JSON.stringify(reqBody),
    }).then((res) => res.json());
  }

  getSignature(path, timestamp) {
    return crypto
      .createHmac("sha256", this._partnerKey)
      .update(`${this._partnerId}${path}${timestamp}`)
      .digest("hex");
  }

  getCurrentTimestamp() {
    return Date.now() / 1000;
  }

  getBaseUrl() {
    return this._isSandbox
      ? "https://partner.test-stable.shopeemobile.com"
      : "https://partner.shopeemobile.com";
  }
}

module.exports = ShopeeApiClient;
