import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { ClaimPacketCard } from './ClaimPacketCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { Gift, History, Send, RefreshCw, Link } from 'lucide-react';
import { Button } from './ui/button';

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

interface PacketListProps {
  contractAddress: `0x${string}`;
  contractABI: any;
  refreshTrigger?: number;
}

export function PacketList({ contractAddress, contractABI, refreshTrigger }: PacketListProps) {
  const { address } = useAccount();
  const [claimedMap, setClaimedMap] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sharedPacket, setSharedPacket] = useState<PacketData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('created');

  // 检查 URL 是否包含红包 ID 参数
  const sharedPacketId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const packetParam = params.get('packet');
    return packetParam ? BigInt(packetParam) : null;
  }, []);

  // 如果有分享的红包链接，默认显示领取红包 tab
  useEffect(() => {
    if (sharedPacketId !== null) {
      setActiveTab('claim');
    }
  }, [sharedPacketId]);

  // 获取用户创建的红包列表
  const { data: userCreatedIds, refetch: refetchCreated, error: createdError, isLoading: isLoadingCreated } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserCreatedPackets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 调试：打印合约调用错误
  useEffect(() => {
    console.log('Debug - contractAddress:', contractAddress);
    console.log('Debug - isLoadingCreated:', isLoadingCreated);
    console.log('Debug - createdError:', createdError);
  }, [contractAddress, isLoadingCreated, createdError]);

  // 获取用户领取的红包列表
  const { data: userClaimedIds, refetch: refetchClaimed } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserClaimedPackets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 构造批量获取创建红包详情的请求
  const createdPacketContracts = (userCreatedIds as bigint[] || []).map((id) => ({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPacket',
    args: [id],
  }));

  // 批量获取我创建的红包详情
  const { data: createdPacketsData, refetch: refetchCreatedDetails } = useReadContracts({
    contracts: createdPacketContracts,
    query: {
      enabled: createdPacketContracts.length > 0,
    },
  });

  // 构造批量获取领取红包详情的请求
  const claimedPacketContracts = (userClaimedIds as bigint[] || []).map((id) => ({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPacket',
    args: [id],
  }));

  // 批量获取我领取的红包详情
  const { data: claimedPacketsData, refetch: refetchClaimedDetails } = useReadContracts({
    contracts: claimedPacketContracts,
    query: {
      enabled: claimedPacketContracts.length > 0,
    },
  });

  // 获取分享的特定红包详情（私密红包，只有通过链接才能看到）
  const { data: sharedPacketData, refetch: refetchSharedPacket } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPacket',
    args: sharedPacketId ? [sharedPacketId] : undefined,
    query: {
      enabled: sharedPacketId !== null,
    },
  });

  // 处理分享的红包数据
  useEffect(() => {
    if (sharedPacketData) {
      const data = sharedPacketData as any;
      setSharedPacket({
        id: data.id,
        creator: data.creator,
        totalAmount: data.totalAmount,
        remainingAmount: data.remainingAmount,
        totalCount: data.totalCount,
        remainingCount: data.remainingCount,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        message: data.message,
        status: data.status,
        isRandom: data.isRandom,
      });
    }
  }, [sharedPacketData]);

  // 解析红包数据
  const parsePacketData = useCallback((result: any): PacketData | null => {
    if (!result || result.status !== 'success' || !result.result) return null;
    const data = result.result as any;
    return {
      id: data.id,
      creator: data.creator,
      totalAmount: data.totalAmount,
      remainingAmount: data.remainingAmount,
      totalCount: data.totalCount,
      remainingCount: data.remainingCount,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      message: data.message,
      status: data.status,
      isRandom: data.isRandom,
    };
  }, []);

  // 调试日志
  useEffect(() => {
    console.log('Debug - address:', address);
    console.log('Debug - userCreatedIds:', userCreatedIds);
    console.log('Debug - createdPacketContracts:', createdPacketContracts);
    console.log('Debug - createdPacketsData:', createdPacketsData);
  }, [address, userCreatedIds, createdPacketContracts, createdPacketsData]);

  // 处理我创建的红包数据
  const myCreatedPackets: PacketData[] = (createdPacketsData || [])
    .map(parsePacketData)
    .filter((p): p is PacketData => p !== null)
    .reverse(); // 最新的在前面

  // 处理我领取的红包数据
  const myClaimedPackets: PacketData[] = (claimedPacketsData || [])
    .map(parsePacketData)
    .filter((p): p is PacketData => p !== null)
    .reverse(); // 最新的在前面

  // 更新 claimedMap
  useEffect(() => {
    if (userClaimedIds && Array.isArray(userClaimedIds)) {
      const claimed: { [key: string]: boolean } = {};
      for (const id of userClaimedIds) {
        claimed[id.toString()] = true;
      }
      setClaimedMap(claimed);
    }
  }, [userClaimedIds]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const refetchPromises = [
      refetchCreated(),
      refetchClaimed(),
      refetchCreatedDetails(),
      refetchClaimedDetails(),
    ];
    // 如果有分享红包，也刷新它
    if (sharedPacketId !== null) {
      refetchPromises.push(refetchSharedPacket());
    }
    await Promise.all(refetchPromises);
    // 等待数据加载
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [refetchCreated, refetchClaimed, refetchCreatedDetails, refetchClaimedDetails, sharedPacketId, refetchSharedPacket]);

  // 当 refreshTrigger 变化时自动刷新
  useEffect(() => {
    if (refreshTrigger) {
      handleRefresh();
    }
  }, [refreshTrigger, handleRefresh]);

  // 加载骨架屏
  const LoadingSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // 空状态
  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  if (!address) {
    return (
      <Alert>
        <Gift className="h-4 w-4" />
        <AlertDescription>
          请先连接钱包以查看红包列表
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">我的红包</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="claim" className="gap-2">
            <Link className="h-4 w-4" />
            领取红包
          </TabsTrigger>
          <TabsTrigger value="created" className="gap-2">
            <Send className="h-4 w-4" />
            我创建的
          </TabsTrigger>
          <TabsTrigger value="claimed" className="gap-2">
            <History className="h-4 w-4" />
            我领取的
          </TabsTrigger>
        </TabsList>

        {/* 领取红包 - 只显示通过分享链接访问的红包 */}
        <TabsContent value="claim" className="space-y-4">
          {sharedPacket ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">有人给你发了红包！</h3>
              </div>
              <div className="max-w-md mx-auto">
                <ClaimPacketCard
                  packet={sharedPacket}
                  contractAddress={contractAddress}
                  contractABI={contractABI}
                  hasClaimed={claimedMap[sharedPacket.id.toString()]}
                  onSuccess={handleRefresh}
                />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Link}
              title="暂无红包"
              description="通过分享链接领取红包。收到红包链接后，点击链接即可在这里看到红包并领取！"
            />
          )}
        </TabsContent>

        {/* 我创建的红包 */}
        <TabsContent value="created" className="space-y-4">
          {isRefreshing ? (
            <LoadingSkeleton />
          ) : myCreatedPackets.length === 0 ? (
            <EmptyState
              icon={Send}
              title="还没有创建红包"
              description="快去创建第一个红包，然后分享链接给朋友！"
            />
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                💡 <strong>提示：</strong>点击红包卡片下方的"分享红包"按钮，将链接发给朋友即可让他们领取。红包链接是私密的，只有收到链接的人才能看到。
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myCreatedPackets.map((packet) => (
                  <ClaimPacketCard
                    key={packet.id.toString()}
                    packet={packet}
                    contractAddress={contractAddress}
                    contractABI={contractABI}
                    hasClaimed={false}
                    onSuccess={handleRefresh}
                    isCreator={true}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* 我领取的红包 */}
        <TabsContent value="claimed" className="space-y-4">
          {isRefreshing ? (
            <LoadingSkeleton />
          ) : myClaimedPackets.length === 0 ? (
            <EmptyState
              icon={History}
              title="还没有领取红包"
              description="通过朋友分享的链接领取红包吧！"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myClaimedPackets.map((packet) => (
                <ClaimPacketCard
                  key={packet.id.toString()}
                  packet={packet}
                  contractAddress={contractAddress}
                  contractABI={contractABI}
                  hasClaimed={true}
                  onSuccess={handleRefresh}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
