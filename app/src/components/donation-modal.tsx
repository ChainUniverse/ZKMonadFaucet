'use client';

import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Heart, X, Loader2, DollarSign } from 'lucide-react';
import { parseEther } from 'viem';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  faucetAddress: string;
  onDonationSuccess?: () => void;
}

export function DonationModal({ isOpen, onClose, faucetAddress, onDonationSuccess }: DonationModalProps) {
  const { toast } = useToast();
  const [donationAmount, setDonationAmount] = useState('');
  const [isValidAmount, setIsValidAmount] = useState(false);

  // Predefined donation amounts
  const presetAmounts = ['1', '5', '10', '20', '100'];

  // Contract write hook
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Validate donation amount
  const validateAmount = (value: string) => {
    try {
      const num = parseFloat(value);
      const isValid = num > 0 && num <= 1000 && !isNaN(num);
      setIsValidAmount(isValid);
      return isValid;
    } catch {
      setIsValidAmount(false);
      return false;
    }
  };

  const handleAmountChange = (value: string) => {
    setDonationAmount(value);
    validateAmount(value);
  };

  const handlePresetClick = (amount: string) => {
    setDonationAmount(amount);
    validateAmount(amount);
  };

  const handleDonate = async () => {
    if (!isValidAmount || !donationAmount) {
      toast({
        title: '无效金额',
        description: '请输入有效的捐款金额',
        variant: 'destructive',
      });
      return;
    }

    try {
      const amountInWei = parseEther(donationAmount);
      
      writeContract({
        address: faucetAddress as `0x${string}`,
        abi: [{
          inputs: [],
          name: 'fundFaucet',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        }] as const,
        functionName: 'fundFaucet',
        value: amountInWei,
      } as any);
    } catch (error) {
      console.error('Error donating:', error);
      toast({
        title: '捐款失败',
        description: error instanceof Error ? error.message : '发起捐款失败，请重试',
        variant: 'destructive',
      });
    }
  };

  // Handle successful donation
  React.useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: '捐款成功！',
        description: `感谢您捐赠 ${donationAmount} MON 给水龙头！`,
      });
      onDonationSuccess?.();
      onClose();
      setDonationAmount('');
      setIsValidAmount(false);
    }
  }, [isConfirmed, hash, donationAmount, toast, onDonationSuccess, onClose]);

  // Handle donation error
  React.useEffect(() => {
    if (error) {
      toast({
        title: '捐款失败',
        description: (error as any)?.message || '捐款失败，请重试',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="modal-backdrop"
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        {/* Modal Content */}
        <div
          className="modal-content"
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '448px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart style={{ width: '24px', height: '24px', color: '#ef4444' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>支持水龙头</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending || isConfirming}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#4b5563', marginBottom: '8px' }}>
                您的捐款将帮助更多用户获得免费的 MON 代币
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                感谢您对社区的支持！❤️
              </p>
            </div>

            {/* Preset amounts */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                快速选择金额 (MON)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={donationAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(amount)}
                    disabled={isPending || isConfirming}
                    style={{ fontSize: '14px' }}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount input */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                自定义金额 (MON)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#9ca3af' }} />
                <input
                  type="number"
                  placeholder="输入金额..."
                  value={donationAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }}
                  min="0.001"
                  max="1000"
                  step="0.001"
                  disabled={isPending || isConfirming}
                />
              </div>
              {donationAmount && !isValidAmount && (
                <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '4px' }}>
                  请输入 0.001 到 1000 之间的有效金额
                </p>
              )}
            </div>

            {/* Donation benefits */}
            <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '500', color: '#1e40af', marginBottom: '8px' }}>您的捐款将用于：</h4>
              <ul style={{ fontSize: '14px', color: '#1d4ed8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>• 为新用户提供更多免费 MON 代币</li>
                <li>• 维持水龙头的长期运行</li>
                <li>• 支持 Monad 生态系统发展</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isPending || isConfirming}
                style={{ flex: '1' }}
              >
                取消
              </Button>
              <Button
                onClick={handleDonate}
                disabled={!isValidAmount || isPending || isConfirming}
                style={{ flex: '1', backgroundColor: '#dc2626' }}
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                    {isPending ? '确认交易...' : '等待确认...'}
                  </>
                ) : (
                  <>
                    <Heart style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    捐赠 {donationAmount || '0'} MON
                  </>
                )}
              </Button>
            </div>

            <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
              您的钱包将请求确认此交易
            </div>
          </div>
        </div>
      </div>
    </>
  );
}