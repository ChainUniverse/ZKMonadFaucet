'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DonationModal } from '@/components/donation-modal';
import { Coins, Clock, Loader2, CheckCircle, Info, Heart } from 'lucide-react';

// Faucet Contract ABI
const faucetABI = [
  {
    inputs: [],
    name: 'claimTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'canClaim',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getTimeUntilNextClaim',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserInfo',
    outputs: [
      { name: 'xAccount', type: 'string' },
      { name: 'lastClaim', type: 'uint256' },
      { name: 'canClaimNow', type: 'bool' },
      { name: 'timeUntilNextClaim', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFaucetStats',
    outputs: [
      { name: 'balance', type: 'uint256' },
      { name: 'totalClaimedAmount', type: 'uint256' },
      { name: 'totalUniqueUsers', type: 'uint256' },
      { name: 'registryAddress', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'CLAIM_AMOUNT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'CLAIM_COOLDOWN',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Contract address
const FAUCET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS as `0x${string}`;

interface MonadFaucetProps {
  isWalletBound?: boolean;
}

export function MonadFaucet({ isWalletBound = false }: MonadFaucetProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  // Contract read hooks
  const { data: canClaim } = useReadContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: faucetABI,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && FAUCET_CONTRACT_ADDRESS && FAUCET_CONTRACT_ADDRESS !== "0x...",
      refetchInterval: 5000,
    },
  });

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: faucetABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && FAUCET_CONTRACT_ADDRESS && FAUCET_CONTRACT_ADDRESS !== "0x...",
      refetchInterval: 5000,
    },
  });

  const { data: faucetStats, refetch: refetchFaucetStats } = useReadContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: faucetABI,
    functionName: 'getFaucetStats',
    query: { 
      enabled: FAUCET_CONTRACT_ADDRESS && FAUCET_CONTRACT_ADDRESS !== "0x...",
      refetchInterval: 10000,
    },
  });

  const { data: claimAmount } = useReadContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: faucetABI,
    functionName: 'CLAIM_AMOUNT',
    query: { 
      enabled: FAUCET_CONTRACT_ADDRESS && FAUCET_CONTRACT_ADDRESS !== "0x...",
    },
  });

  // Contract write hooks
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (userInfo && userInfo[3] > 0) {
      const timer = setInterval(() => {
        const remaining = Number(userInfo[3]) - Math.floor((Date.now() - Date.now()) / 1000);
        setTimeRemaining(Math.max(0, remaining));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [userInfo]);

  // Handle successful claim
  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: '领取成功！',
        description: `成功领取 ${claimAmount ? Number(claimAmount) / 1e18 : 0.1} MON 代币`,
      });
      refetchUserInfo();
    }
  }, [isConfirmed, toast, claimAmount, refetchUserInfo]);

  // Handle claim error
  useEffect(() => {
    if (error) {
      console.error('Claim error:', error);
      toast({
        title: '领取失败',
        description: (error as any)?.message || '领取代币失败，请重试',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleClaimTokens = async () => {
    if (!address) return;

    try {
      writeContract({
        address: FAUCET_CONTRACT_ADDRESS,
        abi: faucetABI,
        functionName: 'claimTokens',
      } as any);
    } catch (error) {
      console.error('Error claiming tokens:', error);
      toast({
        title: '交易失败',
        description: error instanceof Error ? error.message : '发起交易失败，请重试',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '现在可以领取';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时 ${minutes}分钟`;
    if (minutes > 0) return `${minutes}分钟 ${secs}秒`;
    return `${secs}秒`;
  };

  const formatMON = (amount: bigint | number | undefined) => {
    if (!amount) return '0';
    return (Number(amount) / 1e18).toFixed(3);
  };

  if (!mounted) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p>加载中...</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p>请先连接钱包</p>
      </div>
    );
  }

  if (!FAUCET_CONTRACT_ADDRESS || FAUCET_CONTRACT_ADDRESS === "0x...") {
    return (
      <div style={{ padding: '16px', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '8px' }}>
        <h4 style={{ fontWeight: '600', color: '#ca8a04', marginBottom: '8px' }}>⚠️ 水龙头未部署</h4>
        <p style={{ color: '#a16207' }}>
          水龙头合约尚未配置，请联系管理员。
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Faucet Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <Button
            onClick={() => setIsDonationModalOpen(true)}
            variant="outline"
            size="sm"
            style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
          >
            <Heart style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            支持水龙头
          </Button>
        </div>
      </div>

      {/* Faucet Stats */}
      {faucetStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: '600', color: '#1e40af' }}>水龙头余额</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
              {formatMON(faucetStats[0])} MON
            </div>
          </div>
        </div>
      )}

      {/* User Info and Claim Section */}
      <div style={{ padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'linear-gradient(to bottom right, #fff7ed, #fefce8)' }}>
        {!isWalletBound ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Info style={{ width: '48px', height: '48px', color: '#f97316', margin: '0 auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ea580c' }}>需要绑定 X 账号</h3>
            <p style={{ color: '#c2410c' }}>
              请先在上方绑定您的 X 账号，然后就可以领取 MON 代币了！
            </p>
          </div>
        ) : userInfo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* User's X Account */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>您的 X 账号</h3>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>@{userInfo[0]}</p>
            </div>

            {/* Last Claim Info */}
            {userInfo[1] > 0 && (
              <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                上次领取时间: {new Date(Number(userInfo[1]) * 1000).toLocaleString()}
              </div>
            )}

            {/* Claim Button or Countdown */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userInfo[2] ? (
                <Button
                  onClick={handleClaimTokens}
                  disabled={isPending || isConfirming}
                  size="lg"
                  style={{ backgroundColor: '#ea580c', color: 'white', padding: '12px 32px' }}
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                      {isPending ? '确认交易...' : '等待确认...'}
                    </>
                  ) : (
                    <>
                      <Coins style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                      领取 {claimAmount ? formatMON(claimAmount) : '0.1'} MON
                    </>
                  )}
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6b7280' }}>
                    <Clock style={{ width: '20px', height: '20px' }} />
                    <span>下次可领取时间</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {formatTime(Number(userInfo[3]))}
                  </div>
                  <Button disabled size="lg" variant="outline">
                    等待冷却期结束
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <p style={{ color: '#6b7280' }}>加载用户信息...</p>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        faucetAddress={FAUCET_CONTRACT_ADDRESS}
        onDonationSuccess={() => {
          // Refetch stats after successful donation
          setTimeout(() => {
            refetchFaucetStats();
          }, 2000);
        }}
      />
    </div>
  );
}