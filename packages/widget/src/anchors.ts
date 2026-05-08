export interface AnchorConfig {
  domain: string;
  network: 'testnet' | 'public';
  supportsSep24: boolean;
  supportsSep10: boolean;
  assets: string[];
}

export const ANCHORS: Record<string, AnchorConfig> = {
  // SDF's reference anchor — use for development and testing
  'testanchor.stellar.org': {
    domain: 'testanchor.stellar.org',
    network: 'testnet',
    supportsSep24: true,
    supportsSep10: true,
    assets: ['USDC', 'SRT'],
  },
};
