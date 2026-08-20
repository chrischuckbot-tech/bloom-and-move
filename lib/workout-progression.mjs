export function getProgressionStage(rotationRound, stageCount = 3) {
  return (rotationRound - 1) % stageCount;
}

export function isProgressionResetRound(rotationRound, stageCount = 3) {
  return rotationRound > stageCount && getProgressionStage(rotationRound, stageCount) === 0;
}
