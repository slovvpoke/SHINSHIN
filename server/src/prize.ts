import { v4 as uuidv4 } from 'uuid';

// Outcome types
export type OutcomeType = 'ADD' | 'MULT' | 'STOP';

export interface Outcome {
  t: OutcomeType;
  amount?: number; // For ADD
  value?: number;  // For MULT (1.5 or 2.0)
}

export type RoundProfile = 'low' | 'normal' | 'jackpot';

// Stop probability curves (per pick index 0-9)
const STOP_CURVES = {
  normal: [0.06, 0.07, 0.08, 0.10, 0.12, 0.14, 0.17, 0.20, 0.24, 0.28],
  low: [0.12, 0.13, 0.14, 0.16, 0.18, 0.20, 0.23, 0.26, 0.30, 0.34], // +0.06 each, cap 0.60
  jackpot: [0.02, 0.03, 0.04, 0.06, 0.08, 0.10, 0.13, 0.16, 0.20, 0.24], // -0.04 each, cap 0.60
};

// Multiplier probability curves
const MULT_CURVES = {
  normal: [0.02, 0.02, 0.02, 0.025, 0.03, 0.03, 0.035, 0.04, 0.045, 0.05],
  low: [0.01, 0.01, 0.015, 0.02, 0.02, 0.025, 0.03, 0.03, 0.035, 0.04],
  jackpot: [0.05, 0.05, 0.05, 0.055, 0.06, 0.06, 0.065, 0.07, 0.075, 0.08], // +0.03, cap 0.25
};

// Multiplier weights
const MULT_WEIGHTS = { x15: 0.85, x2: 0.15 };

// Profile probabilities
const PROFILE_WEIGHTS = { low: 0.15, normal: 0.82, jackpot: 0.03 };

// Select profile randomly
export function selectProfile(): RoundProfile {
  const r = Math.random();
  if (r < PROFILE_WEIGHTS.low) return 'low';
  if (r < PROFILE_WEIGHTS.low + PROFILE_WEIGHTS.normal) return 'normal';
  return 'jackpot';
}

// Generate base ADD amounts
function generateBaseAddAmounts(
  targetAvg: number,
  maxPicks: number,
  profile: RoundProfile
): number[] {
  const amounts: number[] = [];
  const basePerPick = targetAvg / maxPicks;
  
  for (let i = 0; i < maxPicks; i++) {
    // Add some variance
    const variance = profile === 'jackpot' 
      ? 0.5 + Math.random() * 1.0  // Higher variance for jackpot
      : profile === 'low'
        ? 0.3 + Math.random() * 0.5 // Lower variance for low
        : 0.4 + Math.random() * 0.8; // Normal variance
    
    const amount = Math.round(basePerPick * variance);
    amounts.push(amount);
  }
  
  return amounts;
}

// Generate sequence of outcomes
export function generateSequence(
  targetAvg: number,
  maxWin: number,
  maxPicks: number,
  forcedProfile?: RoundProfile
): { sequence: Outcome[]; profile: RoundProfile; expectedValue: number } {
  const profile = forcedProfile || selectProfile();
  const sequence: Outcome[] = [];
  
  const stopCurve = STOP_CURVES[profile];
  const multCurve = MULT_CURVES[profile];
  
  // Cap for non-jackpot rounds
  const cap = profile === 'jackpot' ? maxWin : Math.floor(maxWin * 0.75);
  
  // Generate base ADD amounts
  const baseAmounts = generateBaseAddAmounts(targetAvg, maxPicks, profile);
  
  let runningTotal = 0;
  let hasStopped = false;
  
  for (let i = 0; i < maxPicks; i++) {
    if (hasStopped) {
      // After stop, remaining outcomes are irrelevant but we generate them anyway
      sequence.push({ t: 'ADD', amount: 0 });
      continue;
    }
    
    const stopProb = stopCurve[Math.min(i, stopCurve.length - 1)];
    const multProb = multCurve[Math.min(i, multCurve.length - 1)];
    
    const r = Math.random();
    
    if (r < stopProb) {
      // STOP outcome
      sequence.push({ t: 'STOP' });
      hasStopped = true;
    } else if (r < stopProb + multProb) {
      // MULT outcome
      const multValue = Math.random() < MULT_WEIGHTS.x15 ? 1.5 : 2.0;
      sequence.push({ t: 'MULT', value: multValue });
      runningTotal = Math.min(runningTotal * multValue, cap);
    } else {
      // ADD outcome
      let amount = baseAmounts[i];
      
      // Clamp to cap
      if (runningTotal + amount > cap) {
        amount = Math.max(0, cap - runningTotal);
      }
      
      sequence.push({ t: 'ADD', amount });
      runningTotal += amount;
    }
  }
  
  // Calculate expected value
  let expectedValue = 0;
  let simBank = 0;
  for (const outcome of sequence) {
    if (outcome.t === 'STOP') break;
    if (outcome.t === 'ADD') {
      simBank += outcome.amount || 0;
    } else if (outcome.t === 'MULT') {
      simBank = Math.floor(simBank * (outcome.value || 1));
    }
    expectedValue = simBank;
  }
  
  return { sequence, profile, expectedValue };
}

// Generate forced max win sequence
export function generateForcedMaxWinSequence(
  maxWin: number,
  maxPicks: number
): Outcome[] {
  const sequence: Outcome[] = [];
  
  // Strategy: Small adds early, big multipliers in middle, final add to reach maxWin exactly
  const earlyPicks = Math.floor(maxPicks * 0.4);
  const midPicks = Math.floor(maxPicks * 0.3);
  
  // Early: small adds to build base
  const basePerPick = Math.floor(maxWin / (maxPicks * 2));
  for (let i = 0; i < earlyPicks; i++) {
    sequence.push({ t: 'ADD', amount: basePerPick + Math.floor(Math.random() * basePerPick) });
  }
  
  // Middle: one or two multipliers
  sequence.push({ t: 'MULT', value: 2.0 });
  for (let i = 1; i < midPicks; i++) {
    if (i === midPicks - 1 && Math.random() > 0.5) {
      sequence.push({ t: 'MULT', value: 1.5 });
    } else {
      sequence.push({ t: 'ADD', amount: basePerPick });
    }
  }
  
  // Late: adds to approach maxWin
  const remainingPicks = maxPicks - earlyPicks - midPicks;
  for (let i = 0; i < remainingPicks - 1; i++) {
    sequence.push({ t: 'ADD', amount: basePerPick * 2 });
  }
  
  // Final pick: will be adjusted to hit maxWin exactly
  sequence.push({ t: 'ADD', amount: 0 }); // Placeholder, will be recalculated
  
  // Calculate running total and adjust final
  let runningTotal = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    const outcome = sequence[i];
    if (outcome.t === 'ADD') {
      runningTotal += outcome.amount || 0;
    } else if (outcome.t === 'MULT') {
      runningTotal = Math.floor(runningTotal * (outcome.value || 1));
    }
  }
  
  // Set final ADD to reach exactly maxWin
  const finalAmount = Math.max(0, maxWin - runningTotal);
  sequence[sequence.length - 1] = { t: 'ADD', amount: finalAmount };
  
  return sequence;
}

// Force remaining sequence to reach maxWin
export function forceSequenceToMaxWin(
  currentBank: number,
  currentPickIndex: number,
  maxWin: number,
  maxPicks: number,
  existingSequence: Outcome[]
): Outcome[] {
  const sequence = [...existingSequence];
  const remaining = maxPicks - currentPickIndex;
  
  if (remaining <= 0) {
    return sequence;
  }
  
  // Remove any STOP from remaining picks
  for (let i = currentPickIndex; i < sequence.length; i++) {
    if (sequence[i]?.t === 'STOP') {
      sequence[i] = { t: 'ADD', amount: 0 };
    }
  }
  
  // Strategy: if bank is small, insert multiplier, then final add to maxWin
  if (remaining >= 2 && currentBank < maxWin * 0.3) {
    // Insert x2 multiplier
    sequence[currentPickIndex] = { t: 'MULT', value: 2.0 };
    
    // Recalculate bank after mult
    const bankAfterMult = Math.floor(currentBank * 2.0);
    
    // Set next outcomes to small adds, final to reach maxWin
    for (let i = currentPickIndex + 1; i < maxPicks - 1; i++) {
      sequence[i] = { t: 'ADD', amount: Math.floor(maxWin * 0.05) };
    }
    
    // Calculate what final add needs to be
    let simBank = bankAfterMult;
    for (let i = currentPickIndex + 1; i < maxPicks - 1; i++) {
      simBank += sequence[i]?.amount || 0;
    }
    
    sequence[maxPicks - 1] = { t: 'ADD', amount: Math.max(0, maxWin - simBank) };
  } else {
    // Bank is already substantial, distribute remaining to reach maxWin
    const deficit = maxWin - currentBank;
    const addPerPick = Math.floor(deficit / remaining);
    
    for (let i = currentPickIndex; i < maxPicks - 1; i++) {
      sequence[i] = { t: 'ADD', amount: addPerPick };
    }
    
    // Final pick gets the remainder
    const simBank = currentBank + addPerPick * (remaining - 1);
    sequence[maxPicks - 1] = { t: 'ADD', amount: Math.max(0, maxWin - simBank) };
  }
  
  return sequence;
}

// Calculate current bank from outcomes
export function calculateBank(sequence: Outcome[], upToIndex: number): number {
  let bank = 0;
  
  for (let i = 0; i <= upToIndex && i < sequence.length; i++) {
    const outcome = sequence[i];
    if (outcome.t === 'STOP') break;
    if (outcome.t === 'ADD') {
      bank += outcome.amount || 0;
    } else if (outcome.t === 'MULT') {
      bank = Math.floor(bank * (outcome.value || 1));
    }
  }
  
  return bank;
}
