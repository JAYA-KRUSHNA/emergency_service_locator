'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fmtDist, fmtDuration } from '@/lib/osrmRouting';
import { DirectionStep } from '@/lib/types';

const TRAFFIC_COLOR: Record<string, string> = {
  light: '#16a34a', moderate: '#d97706', heavy: '#dc2626',
};
const TRAFFIC_LABEL: Record<string, string> = {
  light: 'Light', moderate: 'Moderate', heavy: 'Heavy',
};

export function NavigationPanel() {
  const { isNavigating, selectedService, selectedRoute, exitNavigation } = useApp();
  const [stepIndex, setStepIndex] = useState(0);

  // Reset step when route changes
  useEffect(() => { setStepIndex(0); }, [selectedRoute]);

  if (!isNavigating || !selectedService || !selectedRoute) return null;

  const steps: DirectionStep[] = selectedRoute.steps ?? [];
  const currentStep: DirectionStep | undefined = steps[stepIndex];
  const nextStep: DirectionStep | undefined = steps[stepIndex + 1];
  const totalSteps = steps.length;

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) setStepIndex(i => i + 1);
  };
  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '540px',
      padding: '0 16px',
      zIndex: 30,
      pointerEvents: 'none',
    }} className="anim-fade-in-up">
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
        border: '1px solid var(--c-border)',
        overflow: 'hidden',
        pointerEvents: 'all',
      }}>
        {/* Current instruction */}
        <div style={{
          background: 'linear-gradient(135deg, var(--c-primary) 0%, #1d4ed8 100%)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '50px', height: '50px', flexShrink: 0,
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>
            {currentStep?.icon ?? '↑'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', lineHeight: 1.35, marginBottom: '3px' }}>
              {currentStep?.instruction ?? 'Continue to destination'}
            </div>
            {currentStep && currentStep.distance > 5 && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
                {fmtDist(currentStep.distance)}
              </div>
            )}
          </div>
          {/* Step counter */}
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '99px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'white',
          }}>
            {stepIndex + 1}/{totalSteps}
          </div>
        </div>

        {/* Next step preview */}
        {nextStep && (
          <div style={{
            padding: '10px 20px',
            background: 'var(--c-surface-2)',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '16px', opacity: 0.6 }}>{nextStep.icon ?? '↑'}</span>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--c-text-3)', marginRight: '6px' }}>Then:</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--c-text-2)' }}>
                {nextStep.instruction}
              </span>
            </div>
          </div>
        )}

        {/* Info row */}
        <div style={{
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <InfoPill emoji="📏" value={`${selectedRoute.distance.toFixed(1)} km`} label="Total" />
            <InfoPill emoji="⏱️" value={`${selectedRoute.duration} min`} label="ETA" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: TRAFFIC_COLOR[selectedRoute.traffic] ?? '#94a3b8',
                }} />
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: TRAFFIC_COLOR[selectedRoute.traffic] }}>
                  {TRAFFIC_LABEL[selectedRoute.traffic]}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--c-text-3)' }}>
                Arrive {selectedRoute.arrivalTime}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Prev step */}
            <NavBtn
              emoji="←"
              title="Previous step"
              disabled={stepIndex === 0}
              onClick={handlePrev}
            />
            {/* Next step */}
            <NavBtn
              emoji="→"
              title="Next step"
              disabled={stepIndex >= totalSteps - 1}
              onClick={handleNext}
            />
            {/* Exit */}
            <NavBtn emoji="✕" title="Exit navigation" onClick={exitNavigation} danger />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <div>
      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--c-text-1)', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px' }}>{emoji}</span>{value}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--c-text-3)' }}>{label}</div>
    </div>
  );
}

function NavBtn({
  emoji, title, onClick, danger, disabled,
}: {
  emoji: string; title: string; onClick: () => void; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: '34px', height: '34px',
        borderRadius: '9px',
        background: danger ? 'var(--c-danger-50)' : 'var(--c-surface-2)',
        border: `1px solid ${danger ? 'rgba(220,38,38,0.2)' : 'var(--c-border)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? 'var(--c-danger)' : disabled ? 'var(--c-text-4)' : 'var(--c-text-2)',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.12s',
      }}
    >{emoji}</button>
  );
}
