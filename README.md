# Welcome to your DApp project

## Project info

This is a modern Web3 DApp built with:
- **React** + **TypeScript** + **Vite** for the frontend
- **Wagmi** for Web3 React hooks
- **RainbowKit** for beautiful wallet connection UI
- **shadcn/ui** + **Tailwind CSS** for modern UI components
- **@tanstack/react-query** for data fetching

## Features

- 🔗 **Wallet Connection**: Connect to multiple wallets with RainbowKit
- 🌐 **Multi-chain Support**: Ethereum, Polygon, Optimism, Arbitrum, Base, and more
- 📊 **Real-time Data**: Live blockchain data with automatic updates
- 🎨 **Modern UI**: Beautiful components with shadcn/ui and Tailwind CSS
- 🔒 **Type Safety**: Full TypeScript support for Web3 development
- 📱 **Responsive Design**: Works perfectly on desktop and mobile

## Getting Started

### 1. Configure WalletConnect

Before running the app, you need to get a WalletConnect Project ID:

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Update `src/wagmi.ts` and replace `YOUR_PROJECT_ID` with your actual Project ID

```typescript
export const config = getDefaultConfig({
  appName: 'My DApp',
  projectId: 'your-actual-project-id-here', // Replace this
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: false,
});
```


### 2. Install Dependencies and Run

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── pages/              # Page components
│   ├── DAppHome.tsx    # Main DApp page
│   └── NotFound.tsx    # 404 page
├── wagmi.ts            # Wagmi configuration
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Nora.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure WalletConnect Project ID in src/wagmi.ts

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

**Frontend Framework:**
- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type safety

**Web3 Stack:**
- **Wagmi** - React hooks for Ethereum
- **RainbowKit** - Wallet connection UI
- **Viem** - TypeScript interface for Ethereum

**UI & Styling:**
- **shadcn/ui** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI primitives

**Data Fetching:**
- **@tanstack/react-query** - Data fetching and caching

## Next Steps

1. **Configure WalletConnect**: Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
2. **Customize Chains**: Modify the supported chains in `src/wagmi.ts`
3. **Add Smart Contract Integration**: Use Wagmi hooks to interact with your contracts
4. **Customize UI**: Modify components in `src/pages/DAppHome.tsx`
5. **Add More Pages**: Create additional pages for your DApp features

## Resources

- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Viem Documentation](https://viem.sh)
- [React Documentation](https://react.dev)
