export interface TipReceipt {
  txHash: string;
  amount: string;
  asset: string;
  memo?: string;
}

export interface TipJarConfig {
  to: string;
  suggested?: number[];
  asset?: 'USDC' | 'XLM';
  message?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  onTip?: (receipt: TipReceipt) => void;
}
