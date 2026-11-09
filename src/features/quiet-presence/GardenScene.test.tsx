// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GardenScene, { GARDEN_DEFAULT_BENCH, GARDEN_DEFAULT_SEAT, GARDEN_SEATS } from './GardenScene';
import { gardenSeat } from './gardenSceneModel';
import type { PresenceState } from './presenceTypes';

const peer: PresenceState = { guestKey: 'a6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1', avatarVariant: 'clay', seatId: 'seat-3', gesture: 'sit' };
const props = { language: 'en' as const, connected: true, motionEnabled: true, ownGesture: 'idle' as const, ownSeatId: GARDEN_DEFAULT_SEAT, ownMoving: false, ownWaveKey: 0, peers: [peer], onChooseSeat: vi.fn() };
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('original vector garden diorama', () => {
  it('never depicts unconnected or fabricated visitors and disables travel before joining', () => {
    const { container } = render(<GardenScene {...props} connected={false} />);
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(8);
    expect(screen.getAllByRole('button').every(button => button.hasAttribute('disabled'))).toBe(true);
    expect(screen.getByText('A quiet little world, ready when you are.')).toBeTruthy();
  });

  it('uses named, discrete places and forwards only an existing seat identifier', () => {
    render(<GardenScene {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Pondside bench' }));
    expect(props.onChooseSeat).toHaveBeenCalledWith('seat-3');
    expect(screen.getByRole('button', { name: 'Go to Garden stone' }).getAttribute('aria-pressed')).toBe('true');
    expect(GARDEN_SEATS.find(seat => seat.id === GARDEN_DEFAULT_BENCH)?.bench).toBe(true);
  });

  it('labels the actual own avatar and anchors a seated peer to its shared place', () => {
    const { container, rerender } = render(<GardenScene {...props} />);
    expect(screen.getByText('You')).toBeTruthy();
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(2);
    expect(container.querySelector('.garden-visitor:not(.garden-own)')?.getAttribute('data-seat')).toBe('seat-3');
    expect(container.querySelector('.garden-visitor:not(.garden-own)')?.classList.contains('garden-gesture-sit')).toBe(true);
    rerender(<GardenScene {...props} language="zh" ownSeatId="seat-1" ownGesture="sit" />);
    expect(screen.getByText('你')).toBeTruthy();
    expect(screen.getByRole('button', { name: '走到樹蔭木椅' }).getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.garden-own')?.getAttribute('data-seat')).toBe('seat-1');
  });

  it('restarts a repeated own wave without persistent loops and keeps peer positions stable', () => {
    const { container, rerender } = render(<GardenScene {...props} ownGesture="wave" />);
    const first = container.querySelector('.garden-own > svg');
    const position = container.querySelector('.garden-visitor:not(.garden-own)')?.getAttribute('style');
    rerender(<GardenScene {...props} ownGesture="wave" ownWaveKey={1} peers={[{ ...peer, guestKey: 'f6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1', seatId: 'seat-1' }, peer]} />);
    expect(container.querySelector('.garden-own > svg')).not.toBe(first);
    const seated = [...container.querySelectorAll('.garden-visitor:not(.garden-own)')].find(element => element.getAttribute('data-seat') === 'seat-3');
    expect(seated?.getAttribute('style')).toBe(position);
    expect(gardenSeat(undefined, peer.guestKey)).toEqual(gardenSeat(undefined, peer.guestKey));
  });

  it('walks upright to the selected seat before settling into its seated pose', () => {
    const { container, rerender } = render(<GardenScene {...props} ownSeatId="seat-1" ownGesture="sit" ownMoving />);
    expect(container.querySelector('.garden-own')?.classList.contains('garden-moving')).toBe(true);
    expect(container.querySelector('.garden-own')?.classList.contains('garden-gesture-sit')).toBe(false);
    rerender(<GardenScene {...props} ownSeatId="seat-1" ownGesture="sit" ownMoving={false} />);
    expect(container.querySelector('.garden-own')?.classList.contains('garden-gesture-sit')).toBe(true);
  });

  it('keeps the seated body while waving and uses the same visual variant as shared presence', () => {
    const { container, rerender } = render(<GardenScene {...props} ownGuestKey="c6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1" ownSeatId="seat-3" ownGesture="wave" ownRestingPose="sit" />);
    const own = container.querySelector('.garden-own');
    expect(own?.classList.contains('garden-gesture-wave')).toBe(true);
    expect(own?.classList.contains('garden-gesture-sit')).toBe(true);
    expect(own?.getAttribute('data-variant')).toBe('sage');
    rerender(<GardenScene {...props} ownGuestKey="a6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1" ownSeatId="seat-3" ownGesture="wave" ownRestingPose="sit" ownMoving />);
    expect(own?.classList.contains('garden-gesture-sit')).toBe(false);
    expect(own?.getAttribute('data-variant')).toBe('ochre');
  });
});
