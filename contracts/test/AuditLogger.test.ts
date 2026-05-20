import hre from "hardhat";
import { expect } from "chai";
import { parseAbiItem } from "viem";

describe("AuditLogger", function () {
  it("emits DecisionRecorded with correct args", async function () {
    const [deployer] = await hre.viem.getWalletClients();
    const auditLogger = await hre.viem.deployContract("AuditLogger");

    const proposalHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`;
    const status =
      "0x617070726f766564000000000000000000000000000000000000000000000000" as `0x${string}`; // "approved" padded
    const approver = deployer.account.address;
    const decisionId =
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" as `0x${string}`;

    const publicClient = await hre.viem.getPublicClient();

    const hash = await auditLogger.write.recordDecision([
      proposalHash,
      status,
      approver,
      decisionId,
    ]);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    expect(receipt.status).to.equal("success");

    const logs = await publicClient.getLogs({
      address: auditLogger.address,
      event: parseAbiItem(
        "event DecisionRecorded(bytes32 indexed proposalHash, bytes32 status, address indexed approver, bytes32 indexed decisionId, uint256 timestamp)"
      ),
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    expect(logs).to.have.length(1);
    expect(logs[0].args.proposalHash).to.equal(proposalHash);
    expect(logs[0].args.approver?.toLowerCase()).to.equal(
      approver.toLowerCase()
    );
  });
});
