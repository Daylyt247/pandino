import { Matcher } from './matcher';

export class SubPackageMatcher implements Matcher {
  private readonly packageName: string;
  private readonly sep: string;

  constructor(packageName: string, sep: string) {
    this.packageName = packageName;
    this.sep = sep;
  }

  match(className: string): boolean {
    const pos = className.lastIndexOf(this.sep);
    return pos > -1 && className.substring(0, pos + 1).startsWith(this.packageName);
  }
}
