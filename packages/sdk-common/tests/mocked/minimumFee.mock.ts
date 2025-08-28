import { ChainMinimumFee } from '@rosen-bridge/minimum-fee';
import RosenUserInterface from '../../lib/rosenUserInterface';

/**
 * Mocks RosenUserInterface private getMinimumFeeBox to return a stub object
 * whose getFee returns the provided ChainMinimumFee.
 */
export const mockGetMinimumFeeBox = (
  instance: RosenUserInterface,
  fees: ChainMinimumFee[],
) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  fees.forEach((fee: ChainMinimumFee) => {
    const mockMinimumFeeBox = {
      getFee: vi.fn().mockReturnValue(fee),
    };
    vi.spyOn(instance as any, 'getMinimumFeeBox').mockResolvedValueOnce(
      mockMinimumFeeBox,
    );
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

/**
 * Resets all mocks created by vitest.
 */
export const resetMocks = () => {
  vi.resetAllMocks();
};
