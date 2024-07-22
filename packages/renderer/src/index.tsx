import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as StoreProvider } from 'react-redux';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { dark } from 'decentraland-ui2/dist/theme';

import { store } from '#store';
import { TranslationProvider } from '/@/components/TranslationProvider';

import { Home } from './components/Home';
import { Editor } from './components/Editor';

import '/@/themes';
import { Snackbar } from './components/Snackbar';

const container = document.getElementById('app')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <TranslationProvider>
        <ThemeProvider theme={dark}>
          <Router>
            <Routes>
              <Route
                path="/"
                element={<Home />}
              />
              <Route
                path="/editor"
                element={<Editor />}
              />
            </Routes>
          </Router>
          <Snackbar />
        </ThemeProvider>
      </TranslationProvider>
    </StoreProvider>
  </React.StrictMode>,
);
