import {
  Asset,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

const HORIZON_URL = {
  testnet: 'https://horizon-testnet.stellar.org',
  public: 'https://horizon.stellar.org',
} as const;

// USDC asset definitions per network
export const USDC = {
  testnet: new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  public: new Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
} as const;

export function isValidKey(key: string): boolean {
  try {
    Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export async function buildPaymentXdr(opts: {
  from: string;
  to: string;
  amount: string;
  asset: 'XLM' | 'USDC';
  network: 'testnet' | 'public';
  memo?: string;
}): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL[opts.network]);
  const account = await server.loadAccount(opts.from);
  const stellarAsset = opts.asset === 'XLM' ? Asset.native() : USDC[opts.network];

  const builder = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: opts.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
  }).addOperation(
    Operation.payment({ destination: opts.to, asset: stellarAsset, amount: opts.amount }),
  );

  if (opts.memo) {
    // MEMO_TEXT on Stellar is capped at 28 bytes
    builder.addMemo(Memo.text(opts.memo.slice(0, 28)));
  }

  return builder.setTimeout(180).build().toXDR();
}

export async function submitSignedXdr(
  xdr: string,
  network: 'testnet' | 'public',
): Promise<string> {
  const server = new Horizon.Server(HORIZON_URL[network]);
  const tx = TransactionBuilder.fromXDR(
    xdr,
    network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
  );
  const result = await server.submitTransaction(tx);
  return result.hash;
}

type BalanceLine = Horizon.HorizonApi.BalanceLine;

export async function hasTrustline(
  publicKey: string,
  asset: Asset,
  network: 'testnet' | 'public',
): Promise<boolean> {
  if (asset.isNative()) return true;
  const server = new Horizon.Server(HORIZON_URL[network]);
  const account = await server.loadAccount(publicKey);
  return account.balances.some((b: BalanceLine) => {
    if (b.asset_type === 'native') return false;
    const line = b as Horizon.HorizonApi.BalanceLine<'credit_alphanum4' | 'credit_alphanum12'>;
    return line.asset_code === asset.getCode() && line.asset_issuer === asset.getIssuer();
  });
}
