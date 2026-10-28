
import dotenv from "dotenv";
import { httpServer } from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
