// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://mentalgpt.okulab.com", // ← あなたの本番URL
      changeOrigin: true,
    })
  );
};