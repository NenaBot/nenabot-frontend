import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SetupTab } from '../../components/tabs/SetupTab';
import { ProfileModel } from '../../types/profile.types';

jest.mock('../../services/apiCalls', () => ({
  fetchDefaultProfile: jest.fn().mockResolvedValue({
    name: 'default-profile',
    description: 'Default',
    workZ: 1,
    workR: 2,
    options: {},
  }),
  fetchProfiles: jest.fn().mockResolvedValue([
    {
      name: 'default-profile',
      description: 'Default',
      workZ: 1,
      workR: 2,
      options: {},
    },
  ]),
}));

jest.mock('../../state/mockMode', () => ({
  isMockModeEnabled: jest.fn(() => true),
}));

const selectedProfile: ProfileModel = {
  name: 'default-profile',
  description: 'Default',
  settings: {
    workZ: 1,
    workR: 2,
    options: {},
  },
};

describe('SetupTab', () => {
  test('blocks Continue and shows validation for invalid work values', async () => {
    const onProfileChange = jest.fn();
    const onNext = jest.fn();

    render(
      <SetupTab
        selectedProfile={selectedProfile}
        onProfileChange={onProfileChange}
        onNext={onNext}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue to Camera' })).toBeEnabled();
    });

    const workZInput = screen.getByDisplayValue('1');
    fireEvent.change(workZInput, { target: { value: '' } });

    expect(screen.getAllByText('Invalid input').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Continue to Camera' })).toBeDisabled();

    fireEvent.change(workZInput, { target: { value: '3.5' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue to Camera' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Camera' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onProfileChange).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ workZ: 3.5 }),
      }),
    );
  });
});
