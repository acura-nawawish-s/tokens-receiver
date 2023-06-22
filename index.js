require("dotenv").config();

const express = require("express");
const LazadaApiClient = require("./lazada");
const ShopeeApiClient = require("./shopee");
const app = express();
const lazadaClient = new LazadaApiClient(
  process.env.LAZADA_APP_KEY,
  process.env.LAZADA_APP_SECRET,
  "THAILAND"
);
const shopeeClient = new ShopeeApiClient(
  process.env.SHOPEE_PARTNER_ID,
  process.env.SHOPEE_PARTNER_KEY,
  process.env.SHOPEE_IS_SANDBOX
);

app.get("/", (req, res) => {
  res.json({
    msg: "ok",
  });
});

const oauthRouter = new express.Router();

app.use("/oauth", oauthRouter);

oauthRouter.get("/url/:platform", (req, res) => {
  const { platform } = req.params;
  let authUrl = "";

  switch (platform) {
    case "lazada":
      authUrl = lazadaClient.getAuthUrl(process.env.HOSTNAME);
      break;

    case "shopee":
      authUrl = shopeeClient.getAuthUrl(process.env.HOSTNAME);
      break;

    default:
      msg = `Unsupported platform: '${platform}'`;

      return res.status(400).json({
        success: false,
        msg,
        error: msg,
      });
  }

  console.log("Generated authorization URL: " + authUrl);

  return res.redirect(authUrl);
});

oauthRouter.get("/callback/:platform", async (req, res) => {
  const { platform } = req.params;
  let response;

  console.log(`Received ${platform} authorization callback`);

  switch (platform) {
    case "lazada": {
      const { code } = req.query;

      if (!code) {
        msg = "'code' query parameter is required";

        return res.status(400).json({
          success: false,
          msg,
          error: msg,
        });
      }

      console.log("Authorization code: ", code);

      try {
        console.log("Exchanging code for tokens...");

        response = await lazadaClient.exchangeCodeForTokens(code);
      } catch (e) {
        msg = "Failed to get Lazada tokens: " + e.message;

        console.error(msg);

        return res.status(500).json({
          success: false,
          msg,
          error: msg,
        });
      }
      break;
    }

    case "shopee": {
      const { code, shop_id, main_account_id } = req.query;

      if (!code) {
        msg = "'code' query parameter is required";

        return res.status(400).json({
          success: false,
          msg,
          error: msg,
        });
      }

      console.log("code: ", code);
      console.log("shop_id: ", shop_id);
      console.log("main_account_id: ", main_account_id);

      if (!shop_id && !main_account_id) {
        msg =
          "Either 'shop_id' or 'main_account_id' query paramter is required";

        return res.status(400).json({
          success: false,
          msg,
          error: msg,
        });
      }

      let accountType = "";
      let sellerId = "";

      if (shop_id) {
        accountType = "shop_id";
        sellerId = shop_id;
      } else if (main_account_id) {
        accountType = "main_account_id";
        sellerId = main_account_id;
      } else {
        msg = "Could not determine account type of the seller";

        return res.status(400).json({
          success: false,
          msg,
          error: msg,
        });
      }

      try {
        console.log("Exchanging code for tokens...");

        response = await shopeeClient.exchangeCodeForTokens(
          code,
          sellerId,
          accountType
        );
      } catch (e) {
        msg = "Failed to get Shopee tokens: " + e.message;

        console.error(msg);

        return res.status(500).json({
          success: false,
          msg,
          error: msg,
        });
      }
      break;
    }

    default:
      msg = `Unsupported platform: '${platform}'`;

      return res.status(400).json({
        success: false,
        msg,
        error: msg,
      });
  }

  console.log("Tokens response: ", response);

  return res.sendStatus(200);
});

app.listen(process.env.PORT, () =>
  console.log("Tokens receiver is listening at :" + process.env.PORT)
);
