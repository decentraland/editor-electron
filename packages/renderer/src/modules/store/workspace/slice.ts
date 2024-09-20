import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import pLimit from 'p-limit';
import { npm, settings, workspace } from '#preload';

import { type ThunkAction } from '#store';

import type { Workspace } from '/shared/types/workspace';
import { type Project, SortBy } from '/shared/types/projects';
import { UPDATE_DEPENDENCIES_STRATEGY } from '/shared/types/settings';
import { SDK_PACKAGE } from '/shared/types/pkg';
import { actions as snackbarActions } from '../snackbar';
import type { Async } from '/@/modules/async';

const limit = pLimit(1);

// Helper function to handle SDK package update logic
const handleSdkPackageUpdate = async (project: Project, updateStrategySetting: string) => {
  if (updateStrategySetting === UPDATE_DEPENDENCIES_STRATEGY.DO_NOTHING) {
    return project;
  }

  const isOutdated = await limit(() => workspace.npmPackageOutdated(project.path, SDK_PACKAGE));

  const updatedPackageStatus: Project['packageStatus'] = {
    ...project.packageStatus,
    [SDK_PACKAGE]: { isOutdated },
  };

  if (updateStrategySetting === UPDATE_DEPENDENCIES_STRATEGY.AUTO_UPDATE && isOutdated) {
    try {
      await limit(() => workspace.installNpmPackage(project.path, SDK_PACKAGE));
      updatedPackageStatus[SDK_PACKAGE].isUpdated = true;
    } catch (_) {
      updatedPackageStatus[SDK_PACKAGE].isUpdated = false;
    }
  }

  return {
    ...project,
    packageStatus: updatedPackageStatus,
  };
};

const getProjectsSdkPackageOutdated = async (projects: Project[]) => {
  const updateStrategySetting = await settings.getUpdateDependenciesStrategy();
  return Promise.all(
    projects.map(project => handleSdkPackageUpdate(project, updateStrategySetting)),
  );
};

// actions
const getWorkspace = createAsyncThunk('workspace/getWorkspace', async () => {
  const payload = await workspace.getWorkspace();
  const projects = await getProjectsSdkPackageOutdated(payload.projects);
  return { ...payload, projects };
});
const createProject = createAsyncThunk('workspace/createProject', workspace.createProject);
const deleteProject = createAsyncThunk('workspace/deleteProject', workspace.deleteProject);
const duplicateProject = createAsyncThunk('workspace/duplicateProject', workspace.duplicateProject);
const importProject = createAsyncThunk('workspace/importProject', workspace.importProject);
const reimportProject = createAsyncThunk('workspace/reimportProject', workspace.reimportProject);
const unlistProjects = createAsyncThunk('workspace/unlistProjects', workspace.unlistProjects);
const openFolder = createAsyncThunk('workspace/openFolder', workspace.openFolder);
const saveThumbnail = createAsyncThunk(
  'workspace/saveThumbnail',
  async ({ path, thumbnail }: Parameters<typeof workspace.saveThumbnail>[0]) => {
    await workspace.saveThumbnail({ path, thumbnail });
    const project = await workspace.getProject(path);
    return project;
  },
);
const installProject = createAsyncThunk('npm/install', npm.install);
export const createProjectAndInstall: (
  opts?: Parameters<typeof workspace.createProject>[0],
) => ThunkAction = opts => async dispatch => {
  const { path } = await dispatch(createProject(opts)).unwrap();
  dispatch(installProject(path));
};
const updateSdkPackage = createAsyncThunk('workspace/updateSdkPackage', async (path: string) =>
  workspace.installNpmPackage(path, SDK_PACKAGE),
);

// state
export type WorkspaceState = Async<Workspace>;

const initialState: WorkspaceState = {
  sortBy: SortBy.NEWEST,
  projects: [],
  missing: [],
  templates: [],
  status: 'idle',
  error: null,
};
// slice
export const slice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setSortBy: (state, { payload: type }: PayloadAction<SortBy>) => {
      state.sortBy = type;
    },
    setProjectTitle: (state, { payload }: PayloadAction<{ path: string; title: string }>) => {
      const project = state.projects.find($ => $.path === payload.path)!;
      project.title = payload.title;
    },
  },
  extraReducers: builder => {
    // nth: generic case adder so we don't end up with this mess 👇
    builder
      .addCase(getWorkspace.pending, state => {
        state.status = 'loading';
      })
      .addCase(getWorkspace.fulfilled, (_, action) => {
        return {
          ...action.payload,
          status: 'succeeded',
          error: null,
        };
      })
      .addCase(getWorkspace.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to get workspace';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects = [...state.projects, action.payload];
      })
      .addCase(deleteProject.pending, state => {
        state.status = 'loading';
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        return {
          ...state,
          projects: state.projects.filter($ => $.path !== action.meta.arg),
          status: 'succeeded',
          error: null,
        };
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || `Failed to delete project ${action.meta.arg}`;
      })
      .addCase(duplicateProject.pending, state => {
        state.status = 'loading';
      })
      .addCase(duplicateProject.fulfilled, (state, action) => {
        return {
          ...state,
          projects: state.projects.concat(action.payload),
          status: 'succeeded',
          error: null,
        };
      })
      .addCase(duplicateProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || `Failed to duplicate project ${action.meta.arg}`;
      })
      .addCase(importProject.pending, state => {
        state.status = 'loading';
      })
      .addCase(importProject.fulfilled, (state, action) => {
        const newProject = action.payload;
        return {
          ...state,
          projects: newProject ? state.projects.concat(newProject) : state.projects,
          status: 'succeeded',
          error: null,
        };
      })
      .addCase(importProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || `Failed to import project ${action.meta.arg}`;
      })
      .addCase(reimportProject.pending, state => {
        state.status = 'loading';
      })
      .addCase(reimportProject.fulfilled, (state, action) => {
        const newProject = action.payload;
        return {
          ...state,
          projects: newProject ? state.projects.concat(newProject) : state.projects,
          missing: newProject ? state.missing.filter($ => $ !== action.meta.arg) : state.missing,
          status: 'succeeded',
          error: null,
        };
      })
      .addCase(reimportProject.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || `Failed to re-import project ${action.meta.arg}`;
      })
      .addCase(unlistProjects.pending, state => {
        state.status = 'loading';
      })
      .addCase(unlistProjects.fulfilled, (state, action) => {
        const pathsSet = new Set(action.meta.arg);
        return {
          ...state,
          missing: state.missing.filter($ => !pathsSet.has($)),
          status: 'succeeded',
          error: null,
        };
      })
      .addCase(unlistProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || `Failed to unlists projects: ${action.meta.arg}`;
      })
      .addCase(saveThumbnail.fulfilled, (state, { payload: project }) => {
        const projectIdx = state.projects.findIndex($ => $.path === project.path);
        if (projectIdx !== -1) {
          state.projects[projectIdx] = project;
        }
      })
      .addCase(updateSdkPackage.pending, state => {
        state.status = 'loading';
      })
      .addCase(updateSdkPackage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const projectIdx = state.projects.findIndex($ => $.path === action.meta.arg);
        if (projectIdx !== -1) {
          const project = { ...state.projects[projectIdx] };
          state.projects[projectIdx] = {
            ...project,
            packageStatus: {
              ...project.packageStatus,
              [SDK_PACKAGE]: {
                isOutdated: false,
                isUpdated: true,
              },
            },
          };
        }
      })
      .addCase(updateSdkPackage.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.error.message || `Failed to update the SDK package for project ${action.meta.arg}`;
      })
      .addCase(snackbarActions.removeSnackbar, (state, action) => {
        if (
          action.payload.id.startsWith('dependency-updated-automatically') &&
          action.payload.project
        ) {
          const projectIdx = state.projects.findIndex($ => $.id === action.payload.project!.id);
          if (projectIdx !== -1) {
            state.projects[projectIdx] = {
              ...action.payload.project,
              packageStatus: {
                ...action.payload.project.packageStatus,
                [SDK_PACKAGE]: {
                  ...action.payload.project.packageStatus![SDK_PACKAGE],
                  isUpdated: undefined,
                },
              },
            };
          }
        }
      });
  },
});

// exports
export const actions = {
  ...slice.actions,
  getWorkspace,
  createProject,
  installProject,
  createProjectAndInstall,
  deleteProject,
  duplicateProject,
  importProject,
  reimportProject,
  unlistProjects,
  saveThumbnail,
  openFolder,
  updateSdkPackage,
};
export const reducer = slice.reducer;
export const selectors = { ...slice.selectors };
