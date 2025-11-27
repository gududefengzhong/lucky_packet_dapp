import { useState } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Loader2, Gift } from 'lucide-react';

interface CreatePacketFormProps {
  contractAddress: `0x${string}`;
  contractABI: any;
  onSuccess?: () => void;
}

export function CreatePacketForm({ contractAddress, contractABI, onSuccess }: CreatePacketFormProps) {
  const [amount, setAmount] = useState('');
  const [count, setCount] = useState('5');
  const [duration, setDuration] = useState('24');
  const [message, setMessage] = useState('');
  const [isRandom, setIsRandom] = useState(true);

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效的金额');
      return;
    }

    if (!count || parseInt(count) < 1 || parseInt(count) > 100) {
      toast.error('红包份数必须在 1-100 之间');
      return;
    }

    if (!duration || parseInt(duration) < 1 || parseInt(duration) > 168) {
      toast.error('过期时间必须在 1-168 小时之间');
      return;
    }

    try {
      const durationInSeconds = parseInt(duration) * 3600;
      
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'createPacket',
        args: [BigInt(count), BigInt(durationInSeconds), message, isRandom],
        value: parseEther(amount),
      });

      toast.success('正在创建红包...');
    } catch (err) {
      console.error('创建红包失败:', err);
      toast.error('创建红包失败');
    }
  };

  // 监听交易成功
  if (isSuccess && !isConfirming) {
    toast.success('红包创建成功！🎉');
    // 重置表单
    setAmount('');
    setCount('5');
    setDuration('24');
    setMessage('');
    onSuccess?.();
  }

  // 监听错误
  if (error) {
    toast.error(`错误: ${error.message}`);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-red-500" />
          创建红包
        </CardTitle>
        <CardDescription>
          发送链上红包，与朋友分享好运！
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* 金额输入 */}
          <div className="space-y-2">
            <Label htmlFor="amount">红包金额 (BNB)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isPending || isConfirming}
            />
            <p className="text-sm text-muted-foreground">
              实际金额将扣除 1% 平台手续费
            </p>
          </div>

          {/* 份数输入 */}
          <div className="space-y-2">
            <Label htmlFor="count">红包份数</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              placeholder="5"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
              disabled={isPending || isConfirming}
            />
            <p className="text-sm text-muted-foreground">
              最少 1 份，最多 100 份
            </p>
          </div>

          {/* 过期时间 */}
          <div className="space-y-2">
            <Label htmlFor="duration">过期时间 (小时)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="168"
              placeholder="24"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              disabled={isPending || isConfirming}
            />
            <p className="text-sm text-muted-foreground">
              最短 1 小时，最长 7 天 (168 小时)
            </p>
          </div>

          {/* 祝福语 */}
          <div className="space-y-2">
            <Label htmlFor="message">祝福语</Label>
            <Textarea
              id="message"
              placeholder="恭喜发财，大吉大利！"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={100}
              rows={3}
              disabled={isPending || isConfirming}
            />
            <p className="text-sm text-muted-foreground">
              {message.length}/100 字符
            </p>
          </div>

          {/* 随机/固定金额 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="random">随机金额</Label>
              <p className="text-sm text-muted-foreground">
                {isRandom ? '每份红包金额随机' : '每份红包金额相等'}
              </p>
            </div>
            <Switch
              id="random"
              checked={isRandom}
              onCheckedChange={setIsRandom}
              disabled={isPending || isConfirming}
            />
          </div>

          {/* 预览信息 */}
          {amount && count && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold">预览</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>总金额:</div>
                <div className="font-medium">{amount} BNB</div>
                <div>扣除手续费后:</div>
                <div className="font-medium">
                  {(parseFloat(amount) * 0.99).toFixed(4)} BNB
                </div>
                <div>红包份数:</div>
                <div className="font-medium">{count} 份</div>
                {!isRandom && (
                  <>
                    <div>每份金额:</div>
                    <div className="font-medium">
                      {((parseFloat(amount) * 0.99) / parseInt(count)).toFixed(6)} BNB
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPending ? '确认中...' : '创建中...'}
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                创建红包
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
