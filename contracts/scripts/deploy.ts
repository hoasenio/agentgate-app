import hre from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying AuditLogger with account:", deployer.account.address);

  const auditLogger = await hre.viem.deployContract("AuditLogger");
  const address = auditLogger.address;

  console.log("AuditLogger deployed to:", address);
  console.log(
    `Snowtrace: https://testnet.snowtrace.io/address/${address}`
  );
  console.log(`\nAdd to .env.local:\nAUDIT_LOGGER_ADDRESS=${address}\n`);

  // Persist deployment address for the Next.js app to pick up
  const deploymentsDir = join(__dirname, "../deployments");
  mkdirSync(deploymentsDir, { recursive: true });
  writeFileSync(
    join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify({ address, network: hre.network.name, deployedAt: new Date().toISOString() }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
