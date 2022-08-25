export abstract class AbstractChainContext {

  abstract normAddress(address: string): string;

  abstract signatureVerify(opts: {nonce: string, signature: string, address: string}): Promise<boolean>;

}
