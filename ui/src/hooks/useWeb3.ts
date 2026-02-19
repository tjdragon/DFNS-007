import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

declare global {
    interface Window {
        ethereum: any;
    }
}

export function useWeb3() {
    const [account, setAccount] = useState<string | null>(null)
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
    const [signer, setSigner] = useState<ethers.Signer | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            setError('Please install MetaMask to use this application.')
            return
        }

        try {
            setIsConnecting(true)
            setError(null)
            const browserProvider = new ethers.BrowserProvider(window.ethereum)
            const accounts = await browserProvider.send('eth_requestAccounts', [])
            const browserSigner = await browserProvider.getSigner()

            setAccount(accounts[0])
            setProvider(browserProvider)
            setSigner(browserSigner)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to connect wallet')
        } finally {
            setIsConnecting(false)
        }
    }, [])

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: any) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0])
                } else {
                    setAccount(null)
                    setSigner(null)
                }
            })

            window.ethereum.on('chainChanged', () => {
                window.location.reload()
            })
        }
    }, [])

    return { account, provider, signer, error, isConnecting, connect }
}
