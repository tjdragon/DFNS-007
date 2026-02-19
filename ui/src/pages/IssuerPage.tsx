import { useState, useEffect } from 'react'
import { ethers, parseUnits, formatUnits } from 'ethers'
import { Landmark, PlusCircle, List, ArrowRight, ShieldCheck, Wallet, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useWeb3 } from '../hooks/useWeb3'
import { BOND_ABI, ERC20_ABI } from '../utils/constants'
import { BOND_BYTECODE } from '../utils/contractBytecode'
import { DEFAULT_CURRENCY_ADDRESS } from '../utils/contractHelpers'

interface BondFormData {
    name: string
    symbol: string
    currency: string
    notional: string
    apr: string
    frequency: string
    duration: string
    cap: string
}

export default function IssuerPage() {
    const { account, signer, connect, error: web3Error } = useWeb3()
    const [isDeploying, setIsDeploying] = useState(false)
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [managementAddress, setManagementAddress] = useState('')
    const [bondState, setBondState] = useState<any>(null)
    const [isLoadingState, setIsLoadingState] = useState(false)

    const [formData, setFormData] = useState<BondFormData>({
        name: 'Corporate Bond',
        symbol: 'CB',
        currency: DEFAULT_CURRENCY_ADDRESS,
        notional: '100',
        apr: '400',
        frequency: '7776000', // 3 months
        duration: '31536000', // 1 year
        cap: '1000000',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const deployBond = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!signer) {
            setError('Please connect your wallet first.')
            return
        }

        try {
            setIsDeploying(true)
            setError(null)
            setDeployedAddress(null)
            setTxHash(null)

            const factory = new ethers.ContractFactory(BOND_ABI, BOND_BYTECODE, signer)

            const now = Math.floor(Date.now() / 1000)
            const maturityDate = BigInt(now) + BigInt(formData.duration)

            const deploymentTx = await factory.getDeployTransaction(
                formData.name,
                formData.symbol,
                formData.currency,
                parseUnits(formData.notional, 6),
                BigInt(formData.apr),
                BigInt(formData.frequency),
                maturityDate,
                parseUnits(formData.cap, 6)
            )

            const tx = await signer.sendTransaction(deploymentTx)
            setTxHash(tx.hash)

            const receipt = await tx.wait()
            if (receipt && receipt.contractAddress) {
                setDeployedAddress(receipt.contractAddress)
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Bond deployment failed.')
        } finally {
            setIsDeploying(false)
        }
    }

    // Fetch bond state
    const fetchBondState = async () => {
        if (!signer || !managementAddress || !ethers.isAddress(managementAddress)) return

        try {
            setIsLoadingState(true)
            const contract = new ethers.Contract(managementAddress, BOND_ABI, signer)

            const [
                name, symbol, currency, notional, apr, frequency, maturityDate, cap,
                issuanceClosed, isDefaulted, totalSubscribed, totalBondsIssued, totalBondsRedeemed,
                issuanceDate, nextCouponIndex, couponAmountPerPeriod, timeToNextCoupon
            ] = await Promise.all([
                contract.name(), contract.symbol(), contract.currency(), contract.notional(),
                contract.apr(), contract.frequency(), contract.maturityDate(), contract.cap(),
                contract.issuanceClosed(), contract.isDefaulted(), contract.totalSubscribed(),
                contract.totalBondsIssued(), contract.totalBondsRedeemed(),
                contract.issuanceDate(), contract.nextCouponIndex(), contract.couponAmountPerPeriod(),
                contract.timeToNextCoupon()
            ])

            // Calculate Total Accrued Interest (Liability)
            let totalAccrued = '0'
            if (issuanceClosed && totalBondsIssued > 0n) {
                const now = Math.floor(Date.now() / 1000)
                const timeElapsed = BigInt(now) - BigInt(issuanceDate)
                if (timeElapsed > 0n) {
                    const principal = (BigInt(totalBondsIssued) * BigInt(notional)) / (10n ** 6n)
                    const yearInSeconds = 365n * 24n * 3600n
                    const accrued = (principal * BigInt(apr) * timeElapsed) / (yearInSeconds * 10000n)
                    totalAccrued = formatUnits(accrued, 6)
                }
            }

            setBondState({
                name, symbol, currency,
                notional: formatUnits(notional, 6),
                apr: apr.toString(),
                frequency: frequency.toString(),
                maturityDate: new Date(Number(maturityDate) * 1000).toLocaleString(),
                issuanceDate: issuanceDate.toString() !== '0' ? new Date(Number(issuanceDate) * 1000).toLocaleString() : 'Not Closed',
                cap: formatUnits(cap, 6),
                issuanceClosed, isDefaulted,
                totalSubscribed: formatUnits(totalSubscribed, 6),
                totalBondsIssued: formatUnits(totalBondsIssued, 6),
                totalBondsRedeemed: formatUnits(totalBondsRedeemed, 6),
                nextCouponIndex: nextCouponIndex.toString(),
                couponAmountPerPeriod: formatUnits(couponAmountPerPeriod, 6),
                timeToNextCoupon: timeToNextCoupon.toString(),
                totalAccrued
            })
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoadingState(false)
        }
    }

    useEffect(() => {
        if (deployedAddress) {
            setManagementAddress(deployedAddress)
        }
    }, [deployedAddress])

    useEffect(() => {
        fetchBondState()
    }, [managementAddress, account])

    // Auto-refresh every 30s
    useEffect(() => {
        let interval: any
        if (managementAddress && ethers.isAddress(managementAddress)) {
            interval = setInterval(() => {
                fetchBondState()
            }, 30000)
        }
        return () => clearInterval(interval)
    }, [managementAddress])

    const handleOwnerAction = async (action: string) => {
        if (!signer || !managementAddress) return
        try {
            const contract = new ethers.Contract(managementAddress, BOND_ABI, signer)
            let tx
            if (action === 'close') tx = await contract.closePrimaryIssuance()
            else if (action === 'withdraw') tx = await contract.withdrawProceeds()
            else if (action === 'deposit') {
                // To deposit coupon, we need to approve first
                const currencyAddress = await contract.currency()
                const currencyContract = new ethers.Contract(currencyAddress, ERC20_ABI, signer)
                const couponAmount = await contract.getCouponAmount()
                const approveTx = await currencyContract.approve(managementAddress, couponAmount)
                await approveTx.wait()
                tx = await contract.depositCoupon()
            }
            else if (action === 'returnPrincipal') {
                const currencyAddress = await contract.currency()
                const currencyContract = new ethers.Contract(currencyAddress, ERC20_ABI, signer)
                // Using a default of notional * totalSubscribed for simplicity or asking user? 
                // For now, let's just use the full subscription amount
                const notional = await contract.notional()
                const totalSubscribed = await contract.totalSubscribed()
                const decimals = await contract.decimals()
                const amount = (BigInt(totalSubscribed) * BigInt(notional)) / (BigInt(10) ** BigInt(decimals))

                const approveTx = await currencyContract.approve(managementAddress, amount)
                await approveTx.wait()
                tx = await contract.returnPrincipal(amount)
            }

            if (tx) {
                const receipt = await tx.wait()
                console.log('Action receipt:', receipt)
                fetchBondState()
            }
        } catch (err: any) {
            alert(err.message || 'Action failed')
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Issuer Portal</h1>
                    <p className="text-gray-500">Configure and deploy new institutional bond offerings.</p>
                </div>
                <div className="mt-4 md:mt-0">
                    {!account ? (
                        <button
                            onClick={connect}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                        >
                            <Wallet className="w-5 h-5" />
                            <span>Connect Metamask</span>
                        </button>
                    ) : (
                        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 flex items-center space-x-3">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="font-mono text-sm text-gray-600">
                                {account.substring(0, 6)}...{account.substring(account.length - 4)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Creation Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold">Deploy New Bond</h2>
                            </div>
                            <p className="text-gray-500 text-sm">Fill in the parameters for the new smart contract issuance.</p>
                        </div>

                        <form onSubmit={deployBond} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Bond Name</label>
                                    <input
                                        name="name" value={formData.name} onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        placeholder="e.g. Corporate Bond 2026"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Symbol</label>
                                    <input
                                        name="symbol" value={formData.symbol} onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        placeholder="e.g. CB26"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Currency Address (StableCoin)</label>
                                <input
                                    name="currency" value={formData.currency} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Notional Face Value (Units)</label>
                                    <input
                                        name="notional" value={formData.notional} onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">APR (Basis Points, 400 = 4%)</label>
                                    <input
                                        name="apr" value={formData.apr} onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Coupon Frequency (Seconds)</label>
                                    <input
                                        name="frequency" value={formData.frequency} onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Duration to Maturity (Seconds)</label>
                                    <input
                                        name="duration" value={formData.duration} onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Maximum Cap (Units)</label>
                                <input
                                    name="cap" value={formData.cap} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isDeploying || !account}
                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center space-x-2"
                            >
                                {isDeploying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Deploying Bond...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        <span>Create Bond Offering</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Status Area */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
                        <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                            <List className="w-5 h-5 text-gray-400" />
                            <span>Deployment Status</span>
                        </h3>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start space-x-3 mb-6">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {txHash && (
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 mb-6">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1">Transaction Hash</p>
                                <p className="font-mono text-[10px] break-all mb-2">{txHash}</p>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-bold underline hover:text-blue-800"
                                >
                                    View on Explorer
                                </a>
                            </div>
                        )}

                        {deployedAddress ? (
                            <div className="p-6 bg-emerald-50 text-emerald-800 rounded-3xl border border-emerald-100 text-center">
                                <div className="bg-emerald-500 text-white p-2 rounded-full w-fit mx-auto mb-4">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold mb-1">Bond Deployed!</h4>
                                <p className="text-xs mb-4 opacity-80">Copy this address for the investor portal.</p>
                                <div className="bg-white p-3 rounded-xl border border-emerald-100 font-mono text-sm break-all mb-4 select-all cursor-pointer">
                                    {deployedAddress}
                                </div>
                                <button
                                    onClick={() => setManagementAddress(deployedAddress)}
                                    className="text-xs font-bold flex items-center justify-center space-x-1 mx-auto hover:translate-x-1 transition-transform"
                                >
                                    <span>Manage This Bond</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <Landmark className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p className="text-sm">No active deployment</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold flex items-center space-x-2">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                                    <span>Issuer Dashboard</span>
                                </h3>
                                <button
                                    onClick={fetchBondState}
                                    disabled={isLoadingState || !managementAddress}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                    title="Refresh State"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoadingState ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Manage Contract Address</label>
                                <input
                                    value={managementAddress}
                                    onChange={(e) => setManagementAddress(e.target.value)}
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="0x..."
                                />
                            </div>

                            {bondState ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status</p>
                                            <p className="text-sm font-bold">{bondState.issuanceClosed ? 'Issuance Closed' : 'Funding Active'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Raised</p>
                                            <p className="text-sm font-bold">{bondState.totalSubscribed} / {bondState.cap}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleOwnerAction('close')}
                                            disabled={bondState.issuanceClosed}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Close Primary Issuance
                                        </button>
                                        <button
                                            onClick={() => handleOwnerAction('withdraw')}
                                            className="w-full py-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Withdraw Proceeds
                                        </button>
                                        <button
                                            onClick={() => handleOwnerAction('deposit')}
                                            className="w-full py-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Deposit Coupon #{bondState.nextCouponIndex}
                                        </button>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 font-mono">
                                        <p>Issuance Date: {bondState.issuanceDate}</p>
                                        <p>Maturity: {bondState.maturityDate}</p>
                                        <p>Redeemed: {bondState.totalBondsRedeemed} Units</p>
                                        <p>Accrued Interest (Total): {bondState.totalAccrued} EURC</p>
                                        <p>Next Coupon ID: {bondState.nextCouponIndex}</p>
                                        <p>Total Coupon Amt: {bondState.couponAmountPerPeriod} Units</p>
                                        <p>Time to Next: {bondState.timeToNextCoupon}s</p>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleOwnerAction('returnPrincipal')}
                                            className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-[10px] font-bold transition-colors border border-red-500/30"
                                        >
                                            Return Principal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-600 italic text-sm">
                                    {managementAddress ? 'Fetching bond data...' : 'Enter a bond address to manage'}
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
