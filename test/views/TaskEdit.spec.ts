import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import TaskEdit from '../../src/views/TaskEdit.vue';
import { taskService } from '../../src/services/TaskService';
import { useRoute, useRouter } from 'vue-router';

vi.mock('../../src/services/TaskService', () => ({
  taskService: {
    getTask: vi.fn(),
    modifyTask: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="mock-datatable"><slot></slot></div>',
    props: ['value', 'responsiveLayout'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="mock-column"></div>',
    props: ['field', 'header'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button class="p-button"><slot></slot></button>',
    props: ['label', 'icon', 'class'],
  },
}));

describe('TaskEdit.vue', () => {
  let wrapper: VueWrapper;
  const mockRouter = {
    go: vi.fn(),
  };
  const mockRoute = {
    params: {
      projectId: 'project-1',
      taskid: 'task-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useRoute).mockReturnValue(mockRoute as any);
  });

  it('fetches task on mount', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'OPEN',
      ownerId: 'user-1',
    };

    vi.mocked(taskService.getTask).mockResolvedValue(mockTask);

    wrapper = mount(TaskEdit);
    await flushPromises();

    expect(taskService.getTask).toHaveBeenCalledWith('project-1', 'task-1');
  });

  it('renders task data after loading', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'OPEN',
      ownerId: 'user-1',
    };

    vi.mocked(taskService.getTask).mockResolvedValue(mockTask);

    wrapper = mount(TaskEdit);
    await flushPromises();

    expect(wrapper.text()).toContain('Aufgabe bearbeiten');
  });

  it('displays error message if task fetch fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(taskService.getTask).mockRejectedValue(new Error('Fetch failed'));

    wrapper = mount(TaskEdit);
    await flushPromises();

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Aufgabe konnte nicht geladen werden'),
    );
    alertSpy.mockRestore();
  });

  it('displays "no task found" message when task is null', async () => {
    vi.mocked(taskService.getTask).mockResolvedValue(null);

    wrapper = mount(TaskEdit);
    await flushPromises();

    expect(wrapper.text()).toContain('Keine Aufgabe gefunden.');
  });

  it('saves task correctly', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'OPEN',
      ownerId: 'user-1',
    };

    vi.mocked(taskService.getTask).mockResolvedValue(mockTask);
    vi.mocked(taskService.modifyTask).mockResolvedValue(undefined);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    wrapper = mount(TaskEdit);
    await flushPromises();

    // Modify task data
    wrapper.vm.task.title = 'Updated Task';

    // Find and click save button
    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const saveButton = buttons.find((btn) => btn.props('label') === 'Speichern');
    await saveButton!.trigger('click');

    await flushPromises();

    expect(taskService.modifyTask).toHaveBeenCalledWith(
      'project-1',
      'task-1',
      expect.objectContaining({
        title: 'Updated Task',
      }),
    );

    alertSpy.mockRestore();
  });

  it('navigates back when back button is clicked', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'OPEN',
      ownerId: 'user-1',
    };

    vi.mocked(taskService.getTask).mockResolvedValue(mockTask);

    wrapper = mount(TaskEdit);
    await flushPromises();

    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const backButton = buttons.find((btn) => btn.props('label') === 'Zurück');
    await backButton!.trigger('click');

    expect(mockRouter.go).toHaveBeenCalledWith(-1);
  });

  it('toggles expansion correctly', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'OPEN',
      ownerId: 'user-1',
    };

    vi.mocked(taskService.getTask).mockResolvedValue(mockTask);

    wrapper = mount(TaskEdit);
    await flushPromises();

    const initialExpanded = wrapper.vm.isExpanded;
    
    const buttons = wrapper.findAllComponents({ name: 'Button' });
    const toggleButton = buttons.find(
      (btn) => btn.props('class') === 'toggle-button',
    );
    await toggleButton!.trigger('click');

    expect(wrapper.vm.isExpanded).toBe(!initialExpanded);
  });
});
