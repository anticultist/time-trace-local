import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />);
    expect(screen.getByText('🕒 Time Trace Local')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Track your activity and map events to bookable elements'
      )
    ).toBeInTheDocument();
  });

  it('renders load events button', () => {
    render(<App />);
    expect(screen.getByText('Load Events')).toBeInTheDocument();
  });
});
