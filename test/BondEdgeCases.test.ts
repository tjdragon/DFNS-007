import { expect } from "chai";
import { parseUnits, createPublicClient, createWalletClient, custom, type PublicClient, getContractAddress } from "viem";
import { hardhat } from "viem/chains";
import hre from "hardhat";
import { describe, it, before } from "node:test";

describe("Bond Edge Cases", function () {
    let publicClient: PublicClient;
    let issuer: any;
    let user: any;
    let accounts: string[];
    let provider: any;

    let bond: any;
    let currency: any;
    let bondAddress: any;

    const notional = parseUnits("100", 6); // 100 EURC
    const apr = 400n; // 4% (Basis points)
    const frequency = 604800n; // 1 week
    const maturityDuration = 604800n * 4n + 3600n; // 4 weeks + 1 hour buffer

    async function getLatestTime(): Promise<bigint> {
        const block = await publicClient.getBlock();
        return block.timestamp;
    }

    async function increaseTime(seconds: bigint) {
        await provider.request({ method: "evm_increaseTime", params: [Number(seconds)] });
        await provider.request({ method: "evm_mine" });
    }

    async function deployContract(client: any, name: string, args: any[]) {
        const artifact = await hre.artifacts.readArtifact(name);
        const hash = await client.deployContract({
            abi: artifact.abi,
            bytecode: artifact.bytecode as `0x${string}`,
            args: args
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return { address: receipt.contractAddress, abi: artifact.abi };
    }

    async function getContract(address: `0x${string}`, abi: any, client: any) {
        return {
            address,
            write: new Proxy({}, {
                get: (_, prop) => async (args: any[] = []) => {
                    const hash = await client.writeContract({ address, abi, functionName: prop as string, args });
                    await publicClient.waitForTransactionReceipt({ hash });
                    return hash;
                }
            }) as any,
            read: new Proxy({}, {
                get: (_, prop) => async (args: any[] = []) => {
                    return await publicClient.readContract({ address, abi, functionName: prop as string, args });
                }
            }) as any
        };
    }

    async function setupFreshBond(cap: bigint = parseUnits("1000000", 6)) {
        const now = await getLatestTime();
        const maturityDate = now + maturityDuration;

        const nonce = await publicClient.getTransactionCount({ address: accounts[0] as `0x${string}` });
        const futureBondAddress = await getContractAddress({ from: accounts[0] as `0x${string}`, nonce: BigInt(nonce) });

        const bondInfo = await deployContract(issuer, "Bond", [
            "Test Bond",
            "TB",
            currency.address,
            notional,
            apr,
            frequency,
            maturityDate,
            cap
        ]);
        const bondLocal = await getContract(bondInfo.address!, bondInfo.abi, issuer);
        const bondUserLocal = await getContract(bondInfo.address!, bondInfo.abi, user);
        return { bond: bondLocal, bondUser: bondUserLocal, bondAddress: bondInfo.address, maturityDate };
    }

    before(async function () {
        // @ts-ignore
        const conn = await hre.network.connect();
        provider = conn.provider;
        publicClient = createPublicClient({ chain: hardhat, transport: custom(provider) });

        accounts = await provider.request({ method: "eth_accounts" }) as string[];
        issuer = createWalletClient({ chain: hardhat, transport: custom(provider), account: accounts[0] as `0x${string}` });
        user = createWalletClient({ chain: hardhat, transport: custom(provider), account: accounts[1] as `0x${string}` });

        const stableCoinInfo = await deployContract(issuer, "StableCoin", [accounts[0], "Euro Coin", "EURC"]);
        currency = await getContract(stableCoinInfo.address!, stableCoinInfo.abi, issuer);

        await currency.write.mint([accounts[0], parseUnits("10000000", 6)]);
        await currency.write.mint([accounts[1], parseUnits("10000000", 6)]);
    });

    it("Should revert if attempting to double close issuance", async function () {
        const { bond } = await setupFreshBond();
        await bond.write.closePrimaryIssuance();
        try {
            await bond.write.closePrimaryIssuance();
            expect.fail("Should have reverted");
        } catch (e: any) {
            expect(e.message).to.include("Already closed");
        }
    });

    it("Should revert if subscribing past the cap", async function () {
        const capAmount = parseUnits("500", 6);
        const { bond, bondUser, bondAddress } = await setupFreshBond(capAmount);
        
        const currencyUser = await getContract(currency.address, (await hre.artifacts.readArtifact("StableCoin")).abi, user);
        await currencyUser.write.approve([bondAddress, parseUnits("600", 6)]);

        try {
            await bondUser.write.subscribe([parseUnits("501", 6)]);
            expect.fail("Should have reverted");
        } catch (e: any) {
            expect(e.message).to.include("Cap exceeded");
        }
    });

    it("Should revert if withdrawing proceeds when empty", async function () {
        const { bond } = await setupFreshBond();
        await bond.write.closePrimaryIssuance();
        
        try {
            await bond.write.withdrawProceeds();
            expect.fail("Should have reverted");
        } catch (e: any) {
            expect(e.message).to.include("No proceeds");
        }
    });

    it("Should revert if claiming bond twice", async function () {
        const { bond, bondUser, bondAddress } = await setupFreshBond();
        
        const subAmount = parseUnits("100", 6);
        const currencyUser = await getContract(currency.address, (await hre.artifacts.readArtifact("StableCoin")).abi, user);
        await currencyUser.write.approve([bondAddress, subAmount]);
        await bondUser.write.subscribe([subAmount]);
        
        await bond.write.closePrimaryIssuance();
        
        await bondUser.write.claimBond();
        
        try {
            await bondUser.write.claimBond();
            expect.fail("Should have reverted");
        } catch (e: any) {
            expect(e.message).to.include("No subscription");
        }
    });

    it("Should revert if depositing more coupons than max duration implies", async function () {
        const { bond, bondAddress } = await setupFreshBond();
        await bond.write.closePrimaryIssuance();

        const couponAmount = await bond.read.getCouponAmount();
        
        // Deposit 4 coupons (matching 4 weeks maturity / 1 week frequency)
        for (let i = 0; i < 4; i++) {
            await currency.write.approve([bondAddress, couponAmount]);
            await bond.write.depositCoupon();
        }

        // Try depositing 5th coupon
        try {
            await currency.write.approve([bondAddress, couponAmount]);
            await bond.write.depositCoupon();
            expect.fail("Should have reverted");
        } catch (e: any) {
            expect(e.message).to.include("All coupons funded");
        }
    });
});
