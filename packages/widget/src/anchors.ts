export interface AnchorConfig {
  domain: string;
  network: 'testnet' | 'public';
  supportsSep24: boolean;
  supportsSep10: boolean;
  assets: string[];
}

export const ANCHORS: Record<string, AnchorConfig> = {};
