
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FeeSwap } from "../target/types/fee_swap";
import { getAccount } from "@solana/spl-token";
import * as assert from "assert";


describe("fee_swap_router", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.fee_swap as Program<FeeSwap>;

  const user = provider.wallet.publicKey;

  const userSource = new anchor.web3.PublicKey("8ssn5JfoKJryYHXHNErdBEZhRDNmHUiLAvNAwh8M7CfX");
  const feeWallet = new anchor.web3.PublicKey("HduNhtw3rMdnvDJvx1C3mT8qrM7RQAUixmFkrPZSndnG");
  const dexInputVault = new anchor.web3.PublicKey("3zpKeZueXu4HkMtc4yEfe8ddB3Vo6QvPdbm5iyDbJMMw");

  it("Swaps with 5% fee and verifies balances", async () => {
    const amountIn = new anchor.BN(100_000); // Send 100,000 tokens

    const beforeUser = await getAccount(provider.connection, userSource);
    const beforeFee = await getAccount(provider.connection, feeWallet);
    const beforeDex = await getAccount(provider.connection, dexInputVault);

    const tx = await program.methods
      .swapWithFee(amountIn)
      .accounts({
        user,
        userSource,
        feeWallet,
        dexInputVault,
      })
      .rpc();

    console.log("✅ Transaction:", tx);

    const afterUser = await getAccount(provider.connection, userSource);
    const afterFee = await getAccount(provider.connection, feeWallet);
    const afterDex = await getAccount(provider.connection, dexInputVault);

    const deltaUser = Number(beforeUser.amount - afterUser.amount);
    const deltaFee = Number(afterFee.amount - beforeFee.amount);
    const deltaDex = Number(afterDex.amount - beforeDex.amount);

    console.log("User lost:", deltaUser);
    console.log("Fee wallet gained:", deltaFee);
    console.log("DEX vault gained:", deltaDex);

    assert.strictEqual(deltaUser, 100_000, "User token deduction mismatch");
    assert.strictEqual(deltaFee, 5_000, "Fee wallet didn't receive 5%");
    assert.strictEqual(deltaDex, 95_000, "DEX vault didn't receive 95%");
  });
});
