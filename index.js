import("./backend/src/server.js").catch((error) => {
  console.error("Failed to start Talent IQ server:", error);
  process.exit(1);
});
