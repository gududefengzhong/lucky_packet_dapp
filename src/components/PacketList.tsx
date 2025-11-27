import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ClaimPacketCard } from './ClaimPacketCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { Gift, History, Send, RefreshCw } from 'lucide-react';
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
  const [activePackets, setActivePackets] = useState<PacketData[]>([]);
  const [myCreatedPackets, setMyCreatedPackets] = useState<PacketData[]>([]);
  const [myClaimedPackets, setMyClaimedPackets] = useState<PacketData[]>([]);
  const [claimedMap, setClaimedMap] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取红包总数
  const { data: packetIdCounter } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'packetIdCounter',
  });

  // 获取用户创建的红包列表
  const { data: userCreatedIds, refetch: refetchCreated } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserCreatedPackets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

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

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchCreated(),
      refetchClaimed(),
    ]);
    // 等待数据加载
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // 当 refreshTrigger 变化时自动刷新
  useEffect(() => {
    if (refreshTrigger) {
      handleRefresh();
    }
  }, [refreshTrigger]);

  // 获取所有活跃红包
  useEffect(() => {
    const fetchActivePackets = async () => {
      if (!packetIdCounter) return;

      const packets: PacketData[] = [];
      const totalPackets = Number(packetIdCounter);

      for (let i = 0; i < totalPackets; i++) {
        try {
          const packetData = await fetch(`/api/packet/${i}`).catch(() => null);
          
          // 如果 API 不可用，直接从合约读取
          // 这里简化处理，实际应该批量读取
          const response = await (window as any).ethereum?.request({
            method: 'eth_call',
            params: [{
              to: contractAddress,
              data: contractABI.find((f: any) => f.name === 'getPacket')?.selector + i.toString(16).padStart(64, '0')
            }, 'latest']
          });

          if (response) {
            // 解析响应（这里需要根据实际 ABI 解析）
            // 简化处理：只显示最近的几个红包
            if (i >= totalPackets - 20) {
              packets.push({
                id: BigInt(i),
                creator: '', // 需要实际解析
                totalAmount: BigInt(0),
                remainingAmount: BigInt(0),
                totalCount: BigInt(0),
                remainingCount: BigInt(0),
                createdAt: BigInt(0),
                expiresAt: BigInt(0),
                message: '',
                status: 0,
                isRandom: false,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching packet ${i}:`, error);
        }
      }

      setActivePackets(packets.reverse()); // 最新的在前面
    };

    fetchActivePackets();
  }, [packetIdCounter, contractAddress, contractABI]);

  // 获取我创建的红包详情
  useEffect(() => {
    const fetchMyCreatedPackets = async () => {
      if (!userCreatedIds || !Array.isArray(userCreatedIds)) return;

      const packets: PacketData[] = [];

      for (const id of userCreatedIds) {
        try {
          // 这里应该调用合约的 getPacket 函数
          // 简化处理，实际需要通过 useReadContract 或批量调用
          packets.push({
            id: id as bigint,
            creator: address || '',
            totalAmount: BigInt(0),
            remainingAmount: BigInt(0),
            totalCount: BigInt(0),
            remainingCount: BigInt(0),
            createdAt: BigInt(0),
            expiresAt: BigInt(0),
            message: '',
            status: 0,
            isRandom: false,
          });
        } catch (error) {
          console.error(`Error fetching created packet ${id}:`, error);
        }
      }

      setMyCreatedPackets(packets);
    };

    fetchMyCreatedPackets();
  }, [userCreatedIds, address]);

  // 获取我领取的红包详情
  useEffect(() => {
    const fetchMyClaimedPackets = async () => {
      if (!userClaimedIds || !Array.isArray(userClaimedIds)) return;

      const packets: PacketData[] = [];
      const claimed: { [key: string]: boolean } = {};

      for (const id of userClaimedIds) {
        try {
          claimed[id.toString()] = true;
          
          packets.push({
            id: id as bigint,
            creator: '',
            totalAmount: BigInt(0),
            remainingAmount: BigInt(0),
            totalCount: BigInt(0),
            remainingCount: BigInt(0),
            createdAt: BigInt(0),
            expiresAt: BigInt(0),
            message: '',
            status: 0,
            isRandom: false,
          });
        } catch (error) {
          console.error(`Error fetching claimed packet ${id}:`, error);
        }
      }

      setMyClaimedPackets(packets);
      setClaimedMap(claimed);
    };

    fetchMyClaimedPackets();
  }, [userClaimedIds]);

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
        <h2 className="text-2xl font-bold">红包广场</h2>
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Gift className="h-4 w-4" />
            活跃红包
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

        {/* 活跃红包 */}
        <TabsContent value="active" className="space-y-4">
          {isRefreshing ? (
            <LoadingSkeleton />
          ) : activePackets.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="暂无活跃红包"
              description="当前没有可领取的红包，快去创建一个吧！"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activePackets.map((packet) => (
                <ClaimPacketCard
                  key={packet.id.toString()}
                  packet={packet}
                  contractAddress={contractAddress}
                  contractABI={contractABI}
                  hasClaimed={claimedMap[packet.id.toString()]}
                  onSuccess={handleRefresh}
                />
              ))}
            </div>
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
              description="快去创建第一个红包，与朋友分享好运！"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myCreatedPackets.map((packet) => (
                <ClaimPacketCard
                  key={packet.id.toString()}
                  packet={packet}
                  contractAddress={contractAddress}
                  contractABI={contractABI}
                  hasClaimed={false}
                  onSuccess={handleRefresh}
                />
              ))}
            </div>
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
              description="快去广场领取红包，试试手气！"
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
