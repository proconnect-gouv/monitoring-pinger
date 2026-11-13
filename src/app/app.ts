import bodyParser from "body-parser";
import Express from "express";
import { config } from "../config";
import { dataSource } from "../dataSource";
import { logger } from "../lib/logger";
import { matrix } from "../lib/matrix";
import { router } from "../router";

export { runApp };

async function runApp() {
  const app = Express();

  try {
    console.log(`Initialisation du client Matrix...`);
    await matrix.initialize();
    console.log(`Initialisation du client Matrix réussie !`);
  } catch (error) {
    console.error(error);
  }

  console.log("Connexion à la db...");
  await dataSource.initialize();
  console.log("Connexion à la db réussie !");

  app.use("/api", bodyParser.json(), router);

  app.listen(config.PORT, async () => {
    logger.info(`Server is running on port ${config.PORT}`);
  });
}
