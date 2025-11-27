import { useState, useEffect, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { CreatePacketForm } from '@/components/CreatePacketForm';
import { PacketList } from '@/components/PacketList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gift, List, PlusCircle, Info } from 'lucide-react';
import LuckyPacketABI from '@/contracts/abis/LuckyPacket.json';

// 合约地址从环境变量读取
const CONTRACT_ADDRESS = import.meta.env.VITE_LUCKY_PACKET_CONTRACT_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

// 导入合约 ABI
const CONTRACT_ABI = LuckyPacketABI as any;

const DAppHome = () => {
  const { address, isConnected } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('create');

  // 检查 URL 是否包含红包 ID 参数
  const sharedPacketId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('packet');
  }, []);

  // 如果有分享的红包 ID，自动跳转到红包列表页
  useEffect(() => {
    if (sharedPacketId && isConnected) {
      setActiveTab('list');
    }
  }, [sharedPacketId, isConnected]);

  const handlePacketCreated = () => {
    // 红包创建成功后，触发列表刷新并跳转到红包列表
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  链上幸运红包
                </h1>
                <p className="text-sm text-muted-foreground">Lucky Packet on BSC</p>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="mb-8 text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
            欢迎来到链上红包
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            基于 BSC 的去中心化红包应用 · 安全 · 透明 · 有趣
          </p>
        </div>

        {/* Info Alert for contract setup */}
        {CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000' && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>开发提示</AlertTitle>
            <AlertDescription>
              请先编译并部署智能合约，然后在 <code className="bg-muted px-1 rounded">.env</code> 文件中设置 
              <code className="bg-muted px-1 rounded ml-1">VITE_LUCKY_PACKET_CONTRACT_ADDRESS</code>
            </AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          /* Not Connected State */
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 p-6 rounded-full">
                  <Gift className="h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">连接钱包开始</CardTitle>
              <CardDescription className="text-base">
                连接您的 Web3 钱包以创建和领取红包
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <h4 className="font-semibold mb-1">创建红包</h4>
                    <p className="text-sm text-muted-foreground">发送红包给朋友</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <PlusCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <h4 className="font-semibold mb-1">随机金额</h4>
                    <p className="text-sm text-muted-foreground">拼手气抢红包</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <List className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <h4 className="font-semibold mb-1">查看记录</h4>
                    <p className="text-sm text-muted-foreground">透明可追溯</p>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <ConnectButton />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Connected State - Main App */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="create" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                创建红包
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                红包列表
              </TabsTrigger>
            </TabsList>

            {/* Create Packet Tab */}
            <TabsContent value="create" className="space-y-6">
              <CreatePacketForm
                contractAddress={CONTRACT_ADDRESS}
                contractABI={CONTRACT_ABI}
                onSuccess={handlePacketCreated}
              />

              {/* Instructions */}
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    使用说明
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="font-semibold text-red-600">1.</span>
                    <p>设置红包总金额和份数，支持 1-100 份</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-orange-600">2.</span>
                    <p>选择过期时间（1-168 小时），过期后可退款</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-yellow-600">3.</span>
                    <p>写下祝福语，让红包更有温度</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-green-600">4.</span>
                    <p>选择随机或固定金额，随机更刺激！</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-blue-600">5.</span>
                    <p>确认交易，创建成功后分享链接给朋友</p>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      🔒 <strong>私密红包：</strong>您创建的红包只有通过分享链接才能被他人看到和领取，不会公开显示。
                    </p>
                  </div>
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      💡 <strong>提示：</strong>创建红包将收取 1% 的平台手续费，用于维护和开发。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packet List Tab */}
            <TabsContent value="list">
              <PacketList
                contractAddress={CONTRACT_ADDRESS}
                contractABI={CONTRACT_ABI}
                refreshTrigger={refreshTrigger}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Footer Info */}
        <footer className="mt-16 pt-8 border-t">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a
                href={`https://testnet.bscscan.com/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                合约地址
              </a>
              <a
                href="https://github.com/gududefengzhong"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://x.com/rochestor_mu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                X / Twitter
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for BNB Hackathon · Powered by BSC
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DAppHome;
