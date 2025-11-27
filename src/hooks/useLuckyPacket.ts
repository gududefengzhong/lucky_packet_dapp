import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import LuckyPacketABI from '../contracts/abis/LuckyPacket.json';

// 合约地址和 ABI 配置
const CONTRACT_ADDRESS = import.meta.env.VITE_LUCKY_PACKET_CONTRACT_ADDRESS as `0x${string}`;
const CONTRACT_ABI = LuckyPacketABI as any;

/**
 * 红包数据类型
 */
export interface PacketData {
  id: bigint;
  creator: string;
  totalAmount: bigint;
  remainingAmount: bigint;
  totalCount: bigint;
  remainingCount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  message: string;
  status: number; // 0: Active, 1: Completed, 2: Refunded
  isRandom: boolean;
}

/**
 * 领取记录类型
 */
export interface ClaimRecord {
  claimer: string;
  amount: bigint;
  timestamp: bigint;
}

/**
 * 使用 Lucky Packet 合约的 Hook
 */
export function useLuckyPacket() {
  const { address } = useAccount();

  // ============ 读取函数 ============

  /**
   * 获取红包总数
   */
  const usePacketCounter = () => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'packetIdCounter',
    });
  };

  /**
   * 获取单个红包信息
   */
  const usePacket = (packetId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getPacket',
      args: [packetId],
    });
  };

  /**
   * 获取红包领取记录
   */
  const useClaimRecords = (packetId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getClaimRecords',
      args: [packetId],
    });
  };

  /**
   * 获取用户创建的红包列表
   */
  const useUserCreatedPackets = (userAddress?: `0x${string}`) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getUserCreatedPackets',
      args: userAddress ? [userAddress] : undefined,
      query: {
        enabled: !!userAddress,
      },
    });
  };

  /**
   * 获取用户领取的红包列表
   */
  const useUserClaimedPackets = (userAddress?: `0x${string}`) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getUserClaimedPackets',
      args: userAddress ? [userAddress] : undefined,
      query: {
        enabled: !!userAddress,
      },
    });
  };

  /**
   * 检查用户是否已领取某个红包
   */
  const useHasUserClaimed = (packetId: bigint, userAddress?: `0x${string}`) => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'hasUserClaimed',
      args: userAddress ? [packetId, userAddress] : undefined,
      query: {
        enabled: !!userAddress,
      },
    });
  };

  /**
   * 获取活跃红包数量
   */
  const useActivePacketsCount = () => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getActivePacketsCount',
    });
  };

  /**
   * 获取平台手续费率
   */
  const usePlatformFeeRate = () => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'platformFeeRate',
    });
  };

  // ============ 写入函数 ============

  /**
   * 创建红包
   */
  const useCreatePacket = () => {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const createPacket = (
      totalCount: number,
      expiryDuration: number, // 以小时为单位
      message: string,
      isRandom: boolean,
      amount: string // BNB 金额字符串
    ) => {
      const durationInSeconds = expiryDuration * 3600;
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createPacket',
        args: [BigInt(totalCount), BigInt(durationInSeconds), message, isRandom],
        value: parseEther(amount),
      });
    };

    return {
      createPacket,
      hash,
      isPending,
      error,
    };
  };

  /**
   * 领取红包
   */
  const useClaimPacket = () => {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const claimPacket = (packetId: bigint) => {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimPacket',
        args: [packetId],
      });
    };

    return {
      claimPacket,
      hash,
      isPending,
      error,
    };
  };

  /**
   * 退款过期红包
   */
  const useRefundPacket = () => {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const refundPacket = (packetId: bigint) => {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'refundPacket',
        args: [packetId],
      });
    };

    return {
      refundPacket,
      hash,
      isPending,
      error,
    };
  };

  // ============ 工具函数 ============

  /**
   * 等待交易确认
   */
  const useWaitForTransaction = (hash?: `0x${string}`) => {
    return useWaitForTransactionReceipt({
      hash,
    });
  };

  /**
   * 格式化 BNB 金额
   */
  const formatBNB = (amount: bigint, decimals: number = 4): string => {
    return parseFloat(formatEther(amount)).toFixed(decimals);
  };

  /**
   * 判断红包是否过期
   */
  const isPacketExpired = (expiresAt: bigint): boolean => {
    return Number(expiresAt) * 1000 < Date.now();
  };

  /**
   * 判断红包是否已领完
   */
  const isPacketCompleted = (status: number, remainingCount: bigint): boolean => {
    return status === 1 || Number(remainingCount) === 0;
  };

  /**
   * 计算剩余百分比
   */
  const getRemainingPercent = (remainingCount: bigint, totalCount: bigint): number => {
    return (Number(remainingCount) / Number(totalCount)) * 100;
  };

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 计算剩余时间
   */
  const getTimeRemaining = (expiresAt: bigint): string => {
    const now = Date.now();
    const expiry = Number(expiresAt) * 1000;
    const diff = expiry - now;

    if (diff <= 0) return '已过期';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} 天 ${hours} 小时`;
    } else if (hours > 0) {
      return `${hours} 小时 ${minutes} 分钟`;
    } else {
      return `${minutes} 分钟`;
    }
  };

  return {
    // 配置
    contractAddress: CONTRACT_ADDRESS,
    contractABI: CONTRACT_ABI,
    
    // 读取 hooks
    usePacketCounter,
    usePacket,
    useClaimRecords,
    useUserCreatedPackets,
    useUserClaimedPackets,
    useHasUserClaimed,
    useActivePacketsCount,
    usePlatformFeeRate,
    
    // 写入 hooks
    useCreatePacket,
    useClaimPacket,
    useRefundPacket,
    useWaitForTransaction,
    
    // 工具函数
    formatBNB,
    isPacketExpired,
    isPacketCompleted,
    getRemainingPercent,
    formatTime,
    getTimeRemaining,
  };
}

// 默认导出
export default useLuckyPacket;
