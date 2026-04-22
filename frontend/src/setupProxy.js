const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    createProxyMiddleware("/admin", {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    createProxyMiddleware("/reception", {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    createProxyMiddleware("/doctor", {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    createProxyMiddleware("/patient", {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    createProxyMiddleware("/auth", {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    })
  );
  app.use(
    createProxyMiddleware("/public", {
      target: "http://localhost:8000",
      changeOrigin: true,
      secure: false,
    })
  );
};
