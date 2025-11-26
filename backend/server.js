import dotenv from "dotenv";

dotenv.config();

const startServer = async () => {
  const { default: app } = await import("./src/app.js");
  
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();