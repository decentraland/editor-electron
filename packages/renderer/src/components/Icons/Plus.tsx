import cx from 'classnames';

import type { CommonProps } from './types';

export function Plus({ className }: CommonProps) {
  return (
    <div className={cx('Icon', className)}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.25 6.75H6.75V11.25H5.25V6.75H0.75V5.25H5.25V0.75H6.75V5.25H11.25V6.75Z" fill="white" />
      </svg>
    </div>
  );
}
