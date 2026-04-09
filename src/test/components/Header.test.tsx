import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Header } from '../../components/Header';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useMockMode } from '../../hooks/useMockMode';

jest.mock('../../hooks/useDarkMode', () => ({
  useDarkMode: jest.fn(),
}));

jest.mock('../../hooks/useMockMode', () => ({
  useMockMode: jest.fn(),
}));

describe('Header', () => {
  const mockSetDark = jest.fn();
  const mockSetMockMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDarkMode as jest.Mock).mockReturnValue([false, mockSetDark]);
    (useMockMode as jest.Mock).mockReturnValue([false, mockSetMockMode]);
  });

  test('shows mock toggle inside settings menu and not inline', async () => {
    render(<Header />);

    expect(screen.queryByText('Mock Data')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Toggle dark mode')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Open settings panel'));

    await waitFor(() => {
      expect(screen.getByLabelText('Settings panel')).toBeInTheDocument();
    });

    expect(screen.getByText('Mock Data')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle dark mode')).not.toBeChecked();
    expect(screen.getByLabelText('Toggle mock data')).not.toBeChecked();
  });

  test('updates dark mode when settings toggle is clicked', async () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText('Open settings panel'));

    const darkToggle = await screen.findByLabelText('Toggle dark mode');
    fireEvent.click(darkToggle);

    expect(mockSetDark).toHaveBeenCalledWith(true);
  });

  test('updates mock mode when settings toggle is clicked', async () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText('Open settings panel'));

    const toggle = await screen.findByLabelText('Toggle mock data');
    fireEvent.click(toggle);

    expect(mockSetMockMode).toHaveBeenCalledWith(true);
  });

  test('closes settings menu on outside click and escape', async () => {
    render(<Header />);

    const trigger = screen.getByLabelText('Open settings panel');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByLabelText('Settings panel')).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByLabelText('Settings panel')).not.toBeInTheDocument();
    });

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByLabelText('Settings panel')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByLabelText('Settings panel')).not.toBeInTheDocument();
    });
  });
});
