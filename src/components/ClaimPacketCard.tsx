import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Gift, Clock, Users, Loader2, TrendingUp, Copy, Check } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

interface PacketData {
  id: bigint;
  creator: string;
  totalAmount: bigint;
  remainingAmount: bigint;
  totalCount: bigint;
  remainingCount: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  message: string;
  status: number;
  isRandom: boolean;
}

interface ClaimPacketCardProps {
  packet: PacketData;
  contractAddress: `0x${string}`;
  contractABI: any;
  hasClaimed?: boolean;
  onSuccess?: () => void;
  isCreator?: boolean; // 是否是从"我创建的"页面显示
}

export function ClaimPacketCard({
  packet,
  contractAddress,
  contractABI,
  hasClaimed = false,
  onSuccess,
  isCreator = false
}: ClaimPacketCardProps) {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();

  // 生成分享链接
  const shareLink = `${window.location.origin}?packet=${packet.id.toString()}`;

  // 复制分享链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      toast.success('链接已复制到剪贴板！');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败，请手动复制');
    }
  };

  // 分享到 X (Twitter)
  const handleShareToX = () => {
    const shareText = packet.message
      ? `🧧 ${packet.message} - 快来领取链上红包！`
      : '🧧 有人给你发了一个链上红包，快来领取！';

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // 使用 useEffect 处理交易成功的副作用
  useEffect(() => {
    if (isSuccess && isClaiming) {
      toast.success('🎉 恭喜！红包领取成功！');
      setIsClaiming(false);
      onSuccess?.();
    }
  }, [isSuccess, isClaiming, onSuccess]);

  const handleClaim = async () => {
    if (!address) {
      toast.error('请先连接钱包');
      return;
    }

    if (hasClaimed) {
      toast.error('您已经领取过这个红包了');
      return;
    }

    if (packet.creator.toLowerCase() === address.toLowerCase()) {
      toast.error('不能领取自己创建的红包');
      return;
    }

    setIsClaiming(true);

    try {
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'claimPacket',
        args: [packet.id],
      });

      toast.success('正在领取红包...');
    } catch (err: any) {
      console.error('领取失败:', err);
      toast.error(`领取失败: ${err.message}`);
      setIsClaiming(false);
    }
  };

  // 计算剩余百分比
  const remainingPercent = Number(packet.remainingCount) / Number(packet.totalCount) * 100;

  // 判断是否过期
  const isExpired = Number(packet.expiresAt) * 1000 < Date.now();

  // 判断是否已领完
  const isCompleted = packet.status === 1 || Number(packet.remainingCount) === 0;

  // 判断是否可领取
  const canClaim = !isExpired && !isCompleted && !hasClaimed && address && 
                   packet.creator.toLowerCase() !== address.toLowerCase();

  // 格式化时间
  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 计算过期时间
  const getTimeRemaining = () => {
    const now = Date.now();
    const expiry = Number(packet.expiresAt) * 1000;
    const diff = expiry - now;

    if (diff <= 0) return '已过期';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} 天 ${hours % 24} 小时`;
    }

    return `${hours} 小时 ${minutes} 分钟`;
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">红包 #{packet.id.toString()}</p>
              {packet.message && (
                <p className="font-semibold mt-1">{packet.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isCompleted && (
              <Badge variant="secondary">已领完</Badge>
            )}
            {isExpired && !isCompleted && (
              <Badge variant="destructive">已过期</Badge>
            )}
            {!isExpired && !isCompleted && (
              <Badge variant="default" className="bg-green-500">进行中</Badge>
            )}
            {packet.isRandom ? (
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                拼手气
              </Badge>
            ) : (
              <Badge variant="outline">普通</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 金额信息 */}
        <div className="rounded-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">总金额</p>
              <p className="text-lg font-bold text-red-600">
                {parseFloat(formatEther(packet.totalAmount)).toPrecision(4)} BNB
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">剩余金额</p>
              <p className="text-lg font-bold text-orange-600">
                {parseFloat(formatEther(packet.remainingAmount)).toPrecision(4)} BNB
              </p>
            </div>
          </div>
        </div>

        {/* 进度信息 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {packet.remainingCount.toString()}/{packet.totalCount.toString()} 份
              </span>
            </div>
            <span className="font-medium">{remainingPercent.toFixed(0)}% 剩余</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        </div>

        {/* 时间信息 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">创建时间</p>
            <p className="font-medium">{formatTime(packet.createdAt)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isExpired ? '已过期' : '剩余时间'}
              </p>
            </div>
            <p className={`font-medium ${isExpired ? 'text-red-500' : ''}`}>
              {getTimeRemaining()}
            </p>
          </div>
        </div>

        {/* 创建者信息 */}
        <div className="text-sm">
          <p className="text-muted-foreground">创建者</p>
          <p className="font-mono text-xs mt-1">
            {packet.creator.slice(0, 6)}...{packet.creator.slice(-4)}
          </p>
        </div>

        {/* 已领取提示 */}
        {hasClaimed && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-center">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              ✅ 您已成功领取此红包
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {/* 领取按钮 */}
        <Button
          onClick={handleClaim}
          disabled={!canClaim || isPending || isConfirming || isClaiming}
          className="w-full"
          size="lg"
          variant={canClaim ? "default" : "secondary"}
        >
          {isPending || isConfirming || isClaiming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              领取中...
            </>
          ) : hasClaimed ? (
            '已领取'
          ) : isCompleted ? (
            '已抢完'
          ) : isExpired ? (
            '已过期'
          ) : !address ? (
            '请连接钱包'
          ) : packet.creator.toLowerCase() === address.toLowerCase() ? (
            '不能领取自己的红包'
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              立即领取
            </>
          )}
        </Button>

        {/* 分享按钮 - 创建者始终可见，或红包仍可领取时显示 */}
        {isCreator || (!isExpired && !isCompleted) ? (
          <div className="flex w-full gap-2">
            <Button
              onClick={handleShareToX}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <FaXTwitter className="mr-2 h-4 w-4" />
              分享到 X
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              title="复制链接"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}
