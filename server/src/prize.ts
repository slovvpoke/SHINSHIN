import { v4 as uuidv4 } from 'uuid';

// Outcome types
export type OutcomeType = 'ADD' | 'MULT' | 'STOP';

export interface Outcome {
  t: OutcomeType;
  amount?: number; // For ADD
  value?: number;  // For MULT (1.5 or 2.0)
}

export type RoundProfile = 'low' | 'normal' | 'jackpot';

// Stop probability curves (per pick index 0-13 for 14 tiles)
const STOP_CURVES = {
  normal: [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.25],
  low: [0.08, 0.09, 0.10, 0.11, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.25, 0.28, 0.30, 0.35],
  jackpot: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20],
};

// Multiplier probability curves (per pick index 0-13)
const MULT_CURVES = {
  normal: [0.02, 0.02, 0.02, 0.025, 0.03, 0.03, 0.035, 0.035, 0.04, 0.04, 0.045, 0.045, 0.05, 0.05],
  low: [0.01, 0.01, 0.015, 0.015, 0.02, 0.02, 0.025, 0.025, 0.03, 0.03, 0.035, 0.035, 0.04, 0.04],
  jackpot: [0.04, 0.04, 0.05, 0.05, 0.055, 0.055, 0.06, 0.06, 0.065, 0.065, 0.07, 0.07, 0.075, 0.08],
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

// Generate base ADD amounts with natural variance
function generateBaseAddAmounts(
  targetAvg: number,
  maxPicks: number,
  profile: RoundProfile
): number[] {
  const amounts: number[] = [];
  const basePerPick = targetAvg / maxPicks;
  
  // Use different distribution strategies for variety
  const strategy = Math.random();
  
  for (let i = 0; i < maxPicks; i++) {
    let variance: number;
    
    if (strategy < 0.33) {
      // Strategy 1: Exponential distribution - some very low, some high
      const exp = -Math.log(Math.random() + 0.01);
      variance = Math.min(exp * 0.5, 3.0);
    } else if (strategy < 0.66) {
      // Strategy 2: Bimodal - either low or high
      variance = Math.random() < 0.4 
        ? 0.1 + Math.random() * 0.4  // Low values
        : 1.2 + Math.random() * 1.5; // High values
    } else {
      // Strategy 3: Wide uniform with profile-based range
      variance = profile === 'jackpot' 
        ? 0.2 + Math.random() * 2.5  // Wide range for jackpot
        : profile === 'low'
          ? 0.1 + Math.random() * 0.8 // Tighter low range
          : 0.15 + Math.random() * 2.0; // Normal with good spread
    }
    
    const amount = Math.max(5, Math.round(basePerPick * variance));
    amounts.push(amount);
  }
  
  // Shuffle to avoid patterns
  for (let i = amounts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [amounts[i], amounts[j]] = [amounts[j], amounts[i]];
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
  
  // Minimum guaranteed balance before STOP can occur
  const MIN_GUARANTEED_BALANCE = 2000;
  
  for (let i = 0; i < maxPicks; i++) {
    if (hasStopped) {
      // After stop, remaining outcomes are irrelevant but we generate them anyway
      sequence.push({ t: 'ADD', amount: 0 });
      continue;
    }
    
    const stopProb = stopCurve[Math.min(i, stopCurve.length - 1)];
    const multProb = multCurve[Math.min(i, multCurve.length - 1)];
    
    const r = Math.random();
    
    // Only allow STOP if balance is at least MIN_GUARANTEED_BALANCE
    if (r < stopProb && runningTotal >= MIN_GUARANTEED_BALANCE) {
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
  
  // Strategy: Realistic distribution with varied amounts, occasional multipliers
  // and natural looking progression to maxWin
  
  // Decide on multiplier positions (1-2 multipliers scattered naturally)
  const multPositions: number[] = [];
  const numMults = Math.random() > 0.6 ? 2 : 1;
  
  // Place multipliers in middle third of the game
  const midStart = Math.floor(maxPicks * 0.25);
  const midEnd = Math.floor(maxPicks * 0.7);
  
  for (let m = 0; m < numMults; m++) {
    let pos: number;
    do {
      pos = midStart + Math.floor(Math.random() * (midEnd - midStart));
    } while (multPositions.includes(pos));
    multPositions.push(pos);
  }
  
  // Calculate expected multiplier effect
  let expectedMultiplier = 1;
  const multValues: number[] = [];
  for (let i = 0; i < numMults; i++) {
    const v = Math.random() < 0.8 ? 1.5 : 2.0;
    multValues.push(v);
    expectedMultiplier *= v;
  }
  
  // Work backwards to find base amount needed before multipliers
  // We want final result to be maxWin
  const preMultTarget = Math.floor(maxWin / expectedMultiplier);
  const postMultTarget = maxWin;
  
  // Count ADD picks before first mult and after last mult
  const sortedMults = [...multPositions].sort((a, b) => a - b);
  const firstMult = sortedMults[0];
  const lastMult = sortedMults[sortedMults.length - 1];
  
  const picksBeforeMults = firstMult;
  const picksBetweenMults = numMults > 1 ? (lastMult - firstMult - 1) : 0;
  const picksAfterMults = maxPicks - lastMult - 1;
  
  // Distribute amounts with natural variance
  const generateVariedAmounts = (target: number, count: number): number[] => {
    if (count <= 0) return [];
    const amounts: number[] = [];
    const baseAmount = Math.floor(target / count);
    
    let remaining = target;
    for (let i = 0; i < count - 1; i++) {
      // Add variance: 40% to 160% of base
      const variance = 0.4 + Math.random() * 1.2;
      const amount = Math.floor(baseAmount * variance);
      const cappedAmount = Math.min(amount, remaining - (count - i - 1) * Math.floor(baseAmount * 0.3));
      amounts.push(Math.max(0, cappedAmount));
      remaining -= cappedAmount;
    }
    // Last amount gets the remainder
    amounts.push(Math.max(0, remaining));
    
    // Shuffle to make it less predictable
    for (let i = amounts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [amounts[i], amounts[j]] = [amounts[j], amounts[i]];
    }
    
    return amounts;
  };
  
  // Generate amounts for before multipliers
  const preMultAmounts = generateVariedAmounts(preMultTarget, picksBeforeMults + picksBetweenMults);
  
  // Generate amounts for after multipliers (smaller since already multiplied)
  const postMultNeed = maxWin - Math.floor(preMultTarget * expectedMultiplier);
  const postMultAmounts = generateVariedAmounts(Math.max(0, postMultNeed), picksAfterMults);
  
  // Build sequence
  let preMultIdx = 0;
  let postMultIdx = 0;
  let multIdx = 0;
  
  for (let i = 0; i < maxPicks; i++) {
    if (multPositions.includes(i)) {
      sequence.push({ t: 'MULT', value: multValues[multIdx] });
      multIdx++;
    } else if (i < lastMult) {
      // Before or between multipliers
      const amount = preMultAmounts[preMultIdx] || Math.floor(1000 + Math.random() * 2000);
      sequence.push({ t: 'ADD', amount });
      preMultIdx++;
    } else {
      // After all multipliers
      const amount = postMultAmounts[postMultIdx] || Math.floor(500 + Math.random() * 1500);
      sequence.push({ t: 'ADD', amount });
      postMultIdx++;
    }
  }
  
  // Final pass: recalculate and adjust last ADD to hit maxWin exactly
  let runningTotal = 0;
  let lastAddIndex = -1;
  
  for (let i = 0; i < sequence.length; i++) {
    const outcome = sequence[i];
    if (outcome.t === 'ADD') {
      runningTotal += outcome.amount || 0;
      lastAddIndex = i;
    } else if (outcome.t === 'MULT') {
      runningTotal = Math.floor(runningTotal * (outcome.value || 1));
    }
  }
  
  // Adjust to hit maxWin exactly
  if (lastAddIndex >= 0 && runningTotal !== maxWin) {
    const diff = maxWin - runningTotal;
    const currentAmount = sequence[lastAddIndex].amount || 0;
    sequence[lastAddIndex] = { t: 'ADD', amount: Math.max(0, currentAmount + diff) };
  }
  
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
  
  const deficit = maxWin - currentBank;
  
  // Strategy: Natural distribution with possible multiplier if bank is small
  // Insert multiplier only if bank is very small and we have enough remaining picks
  const needMultiplier = remaining >= 3 && currentBank < maxWin * 0.2;
  
  if (needMultiplier) {
    // Place multiplier somewhere in first half of remaining picks
    const multPos = currentPickIndex + Math.floor(Math.random() * Math.floor(remaining / 2));
    const multValue = Math.random() < 0.7 ? 1.5 : 2.0;
    sequence[multPos] = { t: 'MULT', value: multValue };
    
    // Calculate how much we need before and after the multiplier
    const picksBeforeMult = multPos - currentPickIndex;
    const picksAfterMult = maxPicks - multPos - 1;
    
    // Estimate what bank will be at multiplier time
    // Work backwards: after mult we want bank that * mult + remaining adds = maxWin
    const postMultAddsNeeded = Math.floor(deficit * 0.3); // Leave some for after mult
    const targetBeforeMult = Math.floor((maxWin - postMultAddsNeeded) / multValue);
    const neededBeforeMult = targetBeforeMult - currentBank;
    
    // Distribute before multiplier with variance
    if (picksBeforeMult > 0) {
      const baseAmount = Math.floor(neededBeforeMult / picksBeforeMult);
      for (let i = currentPickIndex; i < multPos; i++) {
        const variance = 0.5 + Math.random();
        sequence[i] = { t: 'ADD', amount: Math.floor(baseAmount * variance) };
      }
    }
    
    // Calculate actual bank at mult point
    let simBank = currentBank;
    for (let i = currentPickIndex; i <= multPos; i++) {
      const o = sequence[i];
      if (o.t === 'ADD') simBank += o.amount || 0;
      else if (o.t === 'MULT') simBank = Math.floor(simBank * (o.value || 1));
    }
    
    // Distribute remaining after multiplier
    const remainingDeficit = maxWin - simBank;
    if (picksAfterMult > 0) {
      const baseAmount = Math.floor(remainingDeficit / picksAfterMult);
      for (let i = multPos + 1; i < maxPicks - 1; i++) {
        const variance = 0.4 + Math.random() * 1.2;
        sequence[i] = { t: 'ADD', amount: Math.floor(baseAmount * variance) };
      }
    }
    
    // Final adjustment
    simBank = currentBank;
    for (let i = currentPickIndex; i < maxPicks - 1; i++) {
      const o = sequence[i];
      if (o.t === 'ADD') simBank += o.amount || 0;
      else if (o.t === 'MULT') simBank = Math.floor(simBank * (o.value || 1));
    }
    sequence[maxPicks - 1] = { t: 'ADD', amount: Math.max(0, maxWin - simBank) };
    
  } else {
    // No multiplier needed - just distribute remaining adds with variance
    const basePerPick = Math.floor(deficit / remaining);
    
    // Generate varied amounts
    const amounts: number[] = [];
    let totalAssigned = 0;
    
    for (let i = 0; i < remaining - 1; i++) {
      const variance = 0.4 + Math.random() * 1.2;
      const amount = Math.floor(basePerPick * variance);
      amounts.push(amount);
      totalAssigned += amount;
    }
    
    // Last amount gets the exact remainder
    amounts.push(Math.max(0, deficit - totalAssigned));
    
    // Shuffle for natural feel (but keep last element as final)
    const toShuffle = amounts.slice(0, -1);
    for (let i = toShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
    }
    
    // Apply shuffled amounts
    for (let i = 0; i < remaining - 1; i++) {
      sequence[currentPickIndex + i] = { t: 'ADD', amount: toShuffle[i] };
    }
    sequence[maxPicks - 1] = { t: 'ADD', amount: amounts[amounts.length - 1] };
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
