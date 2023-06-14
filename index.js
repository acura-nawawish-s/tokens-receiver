require("dotenv").config();

const express = require("express");
const LazadaApiClient = require("./lazada");
const app = express();
const lazadaClient = new LazadaApiClient(
  process.env.LAZADA_APP_KEY,
  process.env.LAZADA_APP_SECRET,
  "THAILAND"
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
    case "lazada":
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
