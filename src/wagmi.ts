import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Lucky Packet DApp',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [bsc, bscTestnet],
  ssr: false,
});

// 导出链配置供其他地方使用
export { bsc, bscTestnet };