import { useDispatch, useSelector } from '#store';
import { useCallback } from 'react';

import { type Project, type SortBy } from '/shared/types/projects';

import { actions as editorActions } from '/@/modules/store/editor';
import { actions as workspaceActions } from '/@/modules/store/workspace';
import { useNavigate } from 'react-router-dom';

export const useWorkspace = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const workspace = useSelector(state => state.workspace);

  const getWorkspace = useCallback(() => {
    dispatch(workspaceActions.getWorkspace());
  }, []);

  const setSortBy = useCallback((type: SortBy) => {
    dispatch(workspaceActions.setSortBy(type));
  }, []);

  const selectProject = useCallback((project: Project) => {
    dispatch(editorActions.setProject(project));
    dispatch(editorActions.runScene(project.path));
    navigate('/editor');
  }, []);

  const createProject = useCallback(() => {
    dispatch(editorActions.createAndRunProject);
    navigate('/editor');
  }, []);

  const deleteProject = useCallback((project: Project) => {
    dispatch(workspaceActions.deleteProject(project.path));
  }, []);

  const duplicateProject = useCallback((project: Project) => {
    dispatch(workspaceActions.duplicateProject(project.path));
  }, []);

  const importProject = useCallback(() => {
    dispatch(workspaceActions.importProject());
  }, []);

  const reimportProject = useCallback((path: string) => {
    dispatch(workspaceActions.reimportProject(path));
  }, []);

  const unlistProjects = useCallback((paths: string[]) => {
    dispatch(workspaceActions.unlistProjects(paths));
  }, []);

  return {
    ...workspace,
    getWorkspace,
    setSortBy,
    selectProject,
    createProject,
    deleteProject,
    duplicateProject,
    importProject,
    reimportProject,
    unlistProjects,
  };
};
