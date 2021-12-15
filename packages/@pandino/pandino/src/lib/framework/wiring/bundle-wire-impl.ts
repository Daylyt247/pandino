import { BundleCapability, BundleRequirement, BundleRevision, BundleWire } from '@pandino/pandino-api';

export class BundleWireImpl implements BundleWire {
  private readonly requirer: BundleRevision;
  private readonly req: BundleRequirement;
  private readonly provider: BundleRevision;
  private readonly cap: BundleCapability;

  constructor(requirer: BundleRevision, req: BundleRequirement, provider: BundleRevision, cap: BundleCapability) {
    this.requirer = requirer;
    this.req = req;
    this.provider = provider;
    this.cap = cap;
  }

  equals(other: any): boolean {
    throw new Error('Not yet implemented!');
  }

  public getRequirer(): BundleRevision {
    return this.requirer;
  }

  public getRequirement(): BundleRequirement {
    return this.req;
  }

  public getProvider(): BundleRevision {
    return this.provider;
  }

  public getCapability(): BundleCapability {
    return this.cap;
  }

  public toString(): string {
    return this.req + ' -> ' + '[' + this.provider + ']';
  }
}
