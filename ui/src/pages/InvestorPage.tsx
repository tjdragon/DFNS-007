import { useState, useEffect } from 'react'
import { ethers, formatUnits, parseUnits } from 'ethers'
import { Wallet, Search, TrendingUp, Calendar, ShieldCheck, DollarSign, Loader2, CheckCircle2, AlertCircle, ArrowUpRight, Gift, Scale, Landmark, RefreshCw } from 'lucide-react'
import { useWeb3 } from '../hooks/useWeb3'
import { BOND_ABI, ERC20_ABI } from '../utils/constants'
// Note: ERC20_ABI was in contractHelpers, let's make sure it's in constants or helpers.
// I'll check and move it if needed. For now I'll import from helpers or just define locally.
import { DEFAULT_CURRENCY_ADDRESS } from '../utils/contractHelpers'

export default function InvestorPage() {
    const { account, signer, connect } = useWeb3()
    const [bondAddress, setBondAddress] = useState('')
    const [bondState, setBondState] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [subscribeAmount, setSubscribeAmount] = useState('1000')

    const [userStats, setUserStats] = useState<any>({
        receipt: '0',
        bondBalance: '0',
        allowance: '0',
        currencyBalance: '0'
    })

    const [isActionLoading, setIsActionLoading] = useState(false)

    const fetchBondData = async () => {
        if (!bondAddress || !ethers.isAddress(bondAddress) || !signer) return

        try {
            setIsLoading(true)
            setError(null)
            const contract = new ethers.Contract(bondAddress, BOND_ABI, signer)
            const currencyAddress = await contract.currency()
            const currencyContract = new ethers.Contract(currencyAddress, [
                "function allowance(address, address) view returns (uint256)",
                "function balanceOf(address) view returns (uint256)",
                "function approve(address, uint256) returns (bool)",
                "function decimals() view returns (uint8)"
            ], signer)

            const [
                name, symbol, notional, apr, frequency, maturityDate, cap,
                issuanceClosed, isDefaulted, totalSubscribed, totalBondsIssued, totalBondsRedeemed,
                issuanceDate, timeToNextCoupon, accruedInterestFetch,
                receipt, bondBalance, allowance, currencyBalance, decimals
            ] = await Promise.all([
                contract.name(), contract.symbol(), contract.notional(), contract.apr(),
                contract.frequency(), contract.maturityDate(), contract.cap(),
                contract.issuanceClosed(), contract.isDefaulted(), contract.totalSubscribed(),
                contract.totalBondsIssued(), contract.totalBondsRedeemed(),
                contract.issuanceDate(), contract.timeToNextCoupon(),
                contract.accruedInterest(account),
                contract.subscriptionReceipts(account),
                contract.balanceOf(account),
                currencyContract.allowance(account, bondAddress),
                currencyContract.balanceOf(account),
                currencyContract.decimals()
            ])

            setBondState({
                name, symbol,
                notional: formatUnits(notional, decimals),
                apr: (Number(apr) / 100).toFixed(2),
                frequency: frequency.toString(),
                maturityDate: new Date(Number(maturityDate) * 1000).toLocaleDateString(),
                cap: formatUnits(cap, decimals),
                issuanceClosed, isDefaulted,
                totalSubscribed: formatUnits(totalSubscribed, decimals),
                totalBondsIssued: totalBondsIssued.toString(),
                totalBondsRedeemed: totalBondsRedeemed.toString(),
                issuanceDate: issuanceDate.toString() !== '0' ? new Date(Number(issuanceDate) * 1000).toLocaleDateString() : 'Not Closed',
                timeToNextCoupon: timeToNextCoupon.toString(),
                accruedInterest: formatUnits(accruedInterestFetch, decimals),
                currencyAddress
            })

            setUserStats({
                receipt: formatUnits(receipt, decimals),
                bondBalance: bondBalance.toString(),
                allowance: formatUnits(allowance, decimals),
                currencyBalance: formatUnits(currencyBalance, decimals),
                decimals
            })
        } catch (err: any) {
            console.error(err)
            setError('Failed to fetch bond data. Check address.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (account && bondAddress) fetchBondData()
    }, [account, bondAddress])

    // Auto-refresh every 30s
    useEffect(() => {
        let interval: any
        if (account && bondAddress && ethers.isAddress(bondAddress)) {
            interval = setInterval(() => {
                fetchBondData()
            }, 30000)
        }
        return () => clearInterval(interval)
    }, [account, bondAddress])

    const handleApprove = async () => {
        if (!signer || !bondState) return
        try {
            setIsActionLoading(true)
            const currencyContract = new ethers.Contract(bondState.currencyAddress, [
                "function approve(address, uint256) returns (bool)"
            ], signer)
            const tx = await currencyContract.approve(bondAddress, ethers.MaxUint256)
            await tx.wait()
            fetchBondData()
        } catch (err: any) {
            alert(err.message || 'Approval failed')
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleAction = async (action: string, param?: any) => {
        if (!signer || !bondAddress) return
        try {
            setIsActionLoading(true)
            const contract = new ethers.Contract(bondAddress, BOND_ABI, signer)
            let tx
            if (action === 'subscribe') tx = await contract.subscribe(parseUnits(subscribeAmount, userStats.decimals))
            else if (action === 'claimBond') tx = await contract.claimBond()
            else if (action === 'claimCoupon') {
                const now = Math.floor(Date.now() / 1000)
                let found = false
                // Match logic from HolderOps.ts: loop to find claimable index
                for (let i = 1; i <= 400; i++) {
                    const couponDate = await contract.getCouponDate(i)
                    if (Number(couponDate) === 0 || Number(couponDate) > now) break

                    const isFunded = await contract.couponFunded(i)
                    const isClaimed = await contract.couponClaimed(i, account)

                    if (isFunded && !isClaimed) {
                        tx = await contract.claimCoupon(i)
                        found = true
                        break // Claim one per click for better UX in browser
                    }
                }
                if (!found) alert("No claimable and funded coupons found.")
            }
            else if (action === 'redeem') tx = await contract.redeem()
            else if (action === 'checkDefault') {
                const now = Math.floor(Date.now() / 1000)
                const gracePeriod = 5 * 24 * 3600 // 5 days
                let found = false
                for (let i = 1; i <= 400; i++) {
                    const couponDate = await contract.getCouponDate(i)
                    if (Number(couponDate) === 0 || (Number(couponDate) + gracePeriod) > now) break

                    const isFunded = await contract.couponFunded(i)
                    if (!isFunded) {
                        tx = await contract.checkDefault(i)
                        found = true
                        break
                    }
                }
                if (!found) alert("No defaults found within the grace period.")
            }

            if (tx) {
                await tx.wait()
                fetchBondData()
            }
        } catch (err: any) {
            alert(err.message || 'Action failed')
        } finally {
            setIsActionLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Investor Portal</h1>
                    <p className="text-gray-500">Discover and manage your crypto bond portfolio.</p>
                </div>
                <div className="mt-4 md:mt-0">
                    {!account ? (
                        <button
                            onClick={connect}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                        >
                            <Wallet className="w-5 h-5" />
                            <span>Connect Wallet</span>
                        </button>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400">YOUR WALLET</p>
                                <p className="font-mono text-sm">{account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
                            </div>
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-12">
                <div className="max-w-xl">
                    <label className="block text-sm font-bold text-gray-700 mb-2 font-mono">
                        BOND SMART CONTRACT ADDRESS
                    </label>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <input
                                value={bondAddress}
                                onChange={(e) => setBondAddress(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm group-focus-within:ring-2 ring-blue-500 outline-none transition-all"
                                placeholder="Enter bond contract address (0x...)"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={fetchBondData}
                                disabled={isLoading || !bondAddress}
                                className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-colors shadow-sm"
                                title="Refresh Data"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={fetchBondData}
                                disabled={isLoading || !bondAddress}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:bg-gray-300 transition-all uppercase text-xs tracking-widest"
                            >
                                {isLoading ? 'Searching...' : 'Search Bond'}
                            </button>
                        </div>
                    </div>
                    {error && <p className="mt-2 text-red-500 text-xs font-bold">{error}</p>}
                </div>
            </div>

            {bondState ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Market Data */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-50">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-blue-600 p-3 rounded-2xl text-white">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{bondState.name}</h2>
                                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-md text-gray-500">{bondState.symbol}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-blue-600">{bondState.apr}%</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target APR</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-gray-400 mb-1"><Calendar className="w-4 h-4" /></div>
                                    <p className="text-sm font-bold">Maturity</p>
                                    <p className="text-xs text-gray-500">{bondState.maturityDate}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-gray-400 mb-1"><DollarSign className="w-4 h-4" /></div>
                                    <p className="text-sm font-bold">Face Value</p>
                                    <p className="text-xs text-gray-500">{bondState.notional} Units</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-gray-400 mb-1"><ShieldCheck className="w-4 h-4" /></div>
                                    <p className="text-sm font-bold">Total Cap</p>
                                    <p className="text-xs text-gray-500">{bondState.cap} Units</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="text-gray-400 mb-1"><Scale className="w-4 h-4" /></div>
                                    <p className="text-sm font-bold">Frequency</p>
                                    <p className="text-xs text-gray-500">Every {Math.floor(Number(bondState.frequency) / 86400)} Days</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-50">
                                    <div className="text-emerald-500 mb-1"><DollarSign className="w-4 h-4" /></div>
                                    <p className="text-sm font-bold">Accrued Interest</p>
                                    <p className="text-xs font-bold text-emerald-600">+{bondState.accruedInterest} EURC</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issuance Date</p>
                                    <p className="text-xs font-bold">{bondState.issuanceDate}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bonds Issued</p>
                                    <p className="text-xs font-bold">{bondState.totalBondsIssued}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bonds Redeemed</p>
                                    <p className="text-xs font-bold">{bondState.totalBondsRedeemed}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Coupon In</p>
                                    <p className="text-xs font-bold">{bondState.timeToNextCoupon}s</p>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Area */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-50 overflow-hidden relative">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="md:w-1/2">
                                    <h3 className="text-xl font-bold mb-2">Subscribe to Bond</h3>
                                    <p className="text-sm text-gray-500 mb-6 italic">Secure your allocation by funding the issuance.</p>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount to Invest</span>
                                                <span className="text-xs font-bold text-blue-600">Bal: {userStats.currencyBalance}</span>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="number" value={subscribeAmount} onChange={(e) => setSubscribeAmount(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-1 ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {Number(userStats.allowance) < Number(subscribeAmount) ? (
                                            <button
                                                onClick={handleApprove}
                                                disabled={isActionLoading}
                                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center space-x-2"
                                            >
                                                {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                                <span>Approve Stablecoin</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction('subscribe')}
                                                disabled={isActionLoading || bondState.issuanceClosed}
                                                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:bg-gray-200"
                                            >
                                                {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                                                <span>{bondState.issuanceClosed ? 'Issuance Closed' : 'Subscribe Now'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="md:w-5/12 bg-blue-50/50 p-6 rounded-3xl border border-blue-50 flex flex-col items-center justify-center text-center">
                                    <div className="text-3xl font-black text-blue-900 mb-1">{((Number(bondState.totalSubscribed) / Number(bondState.cap)) * 100).toFixed(1)}%</div>
                                    <p className="text-xs font-bold text-blue-600/60 transition-all uppercase mb-4">Funding Progress</p>
                                    <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-1000"
                                            style={{ width: `${(Number(bondState.totalSubscribed) / Number(bondState.cap)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500">{bondState.totalSubscribed} / {bondState.cap} Units Filled</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Panel */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                            <h3 className="text-xl font-bold mb-8 flex items-center space-x-3">
                                <Gift className="w-6 h-6 text-blue-400" />
                                <span>My Bond Portfolio</span>
                            </h3>

                            <div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Receipt Balance</p>
                                    <p className="text-2xl font-black">{userStats.receipt} <span className="text-sm font-medium text-slate-500 tracking-normal opacity-50 uppercase">{bondState.symbol}-REC</span></p>
                                    <button
                                        onClick={() => handleAction('claimBond')}
                                        disabled={!bondState.issuanceClosed || Number(userStats.receipt) === 0 || isActionLoading}
                                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-xs font-bold transition-all"
                                    >
                                        Claim Finalized Bonds
                                    </button>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bond Ledger</p>
                                    <p className="text-2xl font-black">{userStats.bondBalance} <span className="text-sm font-medium text-slate-500 tracking-normal opacity-50 uppercase">{bondState.symbol}</span></p>
                                    <div className="mt-4 flex space-x-2">
                                        <button
                                            onClick={() => handleAction('claimCoupon', 0)}
                                            disabled={Number(userStats.bondBalance) === 0 || isActionLoading}
                                            className="flex-1 py-3 border border-slate-700 hover:bg-white/5 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Claim Coupon
                                        </button>
                                        <button
                                            onClick={() => handleAction('redeem')}
                                            disabled={Number(userStats.bondBalance) === 0 || isActionLoading}
                                            className="flex-1 py-3 border border-slate-700 hover:bg-white/5 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Redeem
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <button
                                            onClick={() => handleAction('checkDefault', 0)}
                                            disabled={isActionLoading}
                                            className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-[10px] font-bold transition-all border border-red-500/20"
                                        >
                                            Trigger Default Check
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                                <span>Security Check</span>
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span>Smart Contract Verified</span>
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span>Institutional Grade Custody</span>
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 opacity-50"></div>
                                    <span>Metamask Secured Session</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="bg-gray-50 p-6 rounded-full mb-6">
                        <Landmark className="w-16 h-16 text-gray-200" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-400 mb-2">Search for a Bond</h2>
                    <p className="text-gray-400 max-w-xs text-sm">Enter a valid bond contract address above to view details and start investing.</p>
                </div>
            )}
        </div>
    )
}
