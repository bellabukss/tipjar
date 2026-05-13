/** Describes the shape of each entry in the {@link ANCHORS} map. */
export interface AnchorConfig {
  /** The anchor's home domain (e.g. 	estanchor.stellar.org). */
  domain: string;
  /** Stellar network the anchor operates on. */
  network: 'testnet' | 'public';
  /** Whether the anchor supports SEP-24 interactive deposits/withdrawals. */
  supportsSep24: boolean;
  /** Whether the anchor supports SEP-10 web authentication. */
  supportsSep10: boolean;
  /** List of asset codes supported by this anchor (e.g. ['USDC', 'XLM']). */
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