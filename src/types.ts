export interface Data {
  readonly totalInvestment: number;
  readonly currentValuation: number;
  readonly shareHolders: ShareHolder[];
}

export interface ShareHolder {
  readonly name: string;
  readonly shareRatio: number;
}
