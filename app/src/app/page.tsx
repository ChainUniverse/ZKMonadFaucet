'use client';

import { ConnectWallet } from '@/components/connect-wallet';
import { XAccountBinding } from '@/components/x-account-binding';
import { MonadFaucet } from '@/components/monad-faucet';
import { useAccount, useReadContract } from 'wagmi';
import { GitBranch as Github, X as Twitter, Shield, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// Contract ABI for checking if wallet is bound
const contractABI = [
  {
    inputs: [{ name: 'wallet', type: 'address' }],
    name: 'isWalletBound',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function Home() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Check if wallet is bound to X account
  const { data: isWalletBound } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'isWalletBound',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "0x...",
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              X-Monad Faucet
            </h1>
            <p style={{ fontSize: '20px', color: '#4b5563' }}>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        <header style={{ marginBottom: '48px' }}>
          {/* Top Navigation with Wallet */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px',
            padding: '16px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield style={{ width: '32px', height: '32px', color: '#2563eb' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                X-Monad Faucet
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ConnectWallet />
            </div>
          </div>
          
          {/* Main Title and Description */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              基于 zkTLS 的身份验证水龙头
            </h1>
            <p style={{ fontSize: '20px', color: '#4b5563', maxWidth: '672px', margin: '0 auto' }}>
              无需授权X账号，安全地将您的 X 账号与钱包地址绑定，领取免费 MON 代币
            </p>
          </div>
        </header>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Main Content - Left/Right Layout */}
          <div style={{ 
            display: 'flex', 
            gap: '32px', 
            marginBottom: '32px' 
          }}>
            {/* Left Side - X Account Binding & Plugin Installation */}
            <div style={{ 
              flex: '1',
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              padding: '32px' 
            }}>
              {/* Primus Plugin Installation */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '50%', 
                  padding: '16px', 
                  marginBottom: '16px',
                  display: 'inline-block'
                }}>
                  <Download style={{ width: '32px', height: '32px', color: '#d97706' }} />
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '8px' 
                }}>
                  安装 Primus 验证插件
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  您需要安装 Primus 浏览器插件才能验证 X 账号
                </p>
                <Button
                  onClick={() => window.open('https://chromewebstore.google.com/detail/primus/oeiomhmbaapihbilkfkhmlajkeegnjhe', '_blank')}
                  variant="outline"
                  size="default"
                  style={{ 
                    backgroundColor: '#fbbf24', 
                    borderColor: '#f59e0b', 
                    color: '#92400e',
                    fontWeight: '500'
                  }}
                >
                  <Download style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  安装插件
                </Button>
              </div>

              {/* X Account Binding Section */}
              {isConnected && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ 
                      backgroundColor: '#dbeafe', 
                      borderRadius: '50%', 
                      padding: '16px', 
                      marginBottom: '16px',
                      display: 'inline-block'
                    }}>
                      <Twitter style={{ width: '32px', height: '32px', color: '#2563eb' }} />
                    </div>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '8px' 
                    }}>
                      验证您的 X 账号
                    </h3>
                    <p style={{ color: '#6b7280' }}>
                      使用 Primus zkTLS 技术验证您的 X 账号
                    </p>
                  </div>
                  
                  <XAccountBinding />
                </div>
              )}
              
              {!isConnected && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px', textAlign: 'center' }}>
                  <div style={{ 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '50%', 
                    padding: '16px', 
                    marginBottom: '16px',
                    display: 'inline-block'
                  }}>
                    <Twitter style={{ width: '32px', height: '32px', color: '#6b7280' }} />
                  </div>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    color: '#6b7280', 
                    marginBottom: '8px' 
                  }}>
                    验证您的 X 账号
                  </h3>
                  <p style={{ color: '#9ca3af' }}>
                    请先在右上角连接钱包
                  </p>
                </div>
              )}
            </div>

            {/* Right Side - Faucet */}
            <div style={{ 
              flex: '1',
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              padding: '32px' 
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '8px' 
                }}>
                  MON 代币水龙头
                </h3>
                <p style={{ color: '#6b7280' }}>
                  绑定 X 账号后即可领取免费的 MON 代币
                </p>
              </div>
              
              <MonadFaucet isWalletBound={!!isWalletBound} />
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '32px' 
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '16px' 
            }}>
              关于 X-Monad Faucet
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Shield style={{ width: '20px', height: '20px', color: '#3b82f6', marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontWeight: '500', color: '#111827' }}>隐私保护</h4>
                  <p style={{ fontSize: '14px' }}>
                    使用 zkTLS 技术，您的敏感数据永远不会暴露给第三方
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Twitter style={{ width: '20px', height: '20px', color: '#3b82f6', marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontWeight: '500', color: '#111827' }}>身份验证</h4>
                  <p style={{ fontSize: '14px' }}>
                    通过 Primus SDK 验证您的 X 账号所有权
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Github style={{ width: '20px', height: '20px', color: '#3b82f6', marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontWeight: '500', color: '#111827' }}>开源透明</h4>
                  <p style={{ fontSize: '14px' }}>
                    所有代码开源，智能合约部署在 Monad 测试网
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}