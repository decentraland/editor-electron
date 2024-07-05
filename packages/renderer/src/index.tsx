import React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider as StoreProvider} from 'react-redux';
import {MemoryRouter as Router, Routes, Route} from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import {dark} from 'decentraland-ui2/dist/theme';

import {store} from '#store';
import {TranslationProvider} from '/@/components/TranslationProvider';
import {fetchTranslations} from '/@/modules/store/reducers/translation';
import {locales} from '/@/modules/store/reducers/translation/utils';

import {App} from '/@/components/App/component';

import '/@/themes';

const container = document.getElementById('app')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <TranslationProvider
        locales={locales}
        fetchTranslations={fetchTranslations}
      >
        <ThemeProvider theme={dark}>
          <Router>
            <Routes>
              <Route
                path="/"
                element={<App />}
              />
            </Routes>
          </Router>
        </ThemeProvider>
      </TranslationProvider>
    </StoreProvider>
  </React.StrictMode>,
);
