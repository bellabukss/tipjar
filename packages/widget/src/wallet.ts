import {
  isConnected,
  requestAccess,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';
import { Networks } from '@stellar/stellar-sdk';

export interface WalletState {
  publicKey: string;
  network: 'testnet' | 'public';
}

export async function isFreighterAvailable(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function connectFreighter(): Promise<WalletState> {
  const access = await requestAccess();
  if (access.error) throw new Error(access.error);

  const net = await getNetwork();
  const network: 'testnet' | 'public' =
    net.networkPassphrase === Networks.PUBLIC ? 'public' : 'testnet';

  return { publicKey: access.publicKey, network };
}

export async function signWithFreighter(
  xdr: string,
  network: 'testnet' | 'public',
): Promise<string> {
  const networkPassphrase =
    network === 'public' ? Networks.PUBLIC : Networks.TESTNET;

  const result = await signTransaction(xdr, { networkPassphrase });
  if (result.error) throw new Error(result.error);
  return result.signedTxXdr;
}
