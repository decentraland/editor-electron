import { useCallback, type SyntheticEvent } from 'react';
import { type SnackbarCloseReason } from 'decentraland-ui2';

import { useDispatch, useSelector } from '#store';
import { actions } from '/@/modules/store/snackbar';
import type { Notification } from '/@/modules/store/snackbar/types';

export function useSnackbar() {
  const dispatch = useDispatch();
  const snackbar = useSelector(state => state.snackbar);

  const dismiss = useCallback(
    (id: Notification['id'], idx: number) =>
      (_: SyntheticEvent<any> | Event, reason: SnackbarCloseReason) => {
        if (reason === 'timeout') dispatch(actions.removeSnackbar(id));
        if (reason === 'escapeKeyDown' && idx === 0) {
          const first = snackbar.notifications[0];
          dispatch(actions.removeSnackbar(first.id));
        }
      },
    [snackbar.notifications],
  );

  const close = useCallback(
    (id: Notification['id']) => () => {
      dispatch(actions.removeSnackbar(id));
    },
    [],
  );

  return {
    ...snackbar,
    close,
    dismiss,
  };
}
