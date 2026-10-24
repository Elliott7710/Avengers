let activeEditingSlideId: string | null = null;
let activeSelection = false;

export function setActiveEditingSlide(slideId: string) {
  activeEditingSlideId = slideId;
  activeSelection = false;
}

export function setActiveSdmSelection(slideId: string, hasSelection: boolean) {
  if (activeEditingSlideId === slideId) {
    activeSelection = hasSelection;
  }
}

export function clearActiveEditingSlide(slideId: string) {
  if (activeEditingSlideId === slideId) {
    activeEditingSlideId = null;
    activeSelection = false;
  }
}

export function isSdmEditingActive(): boolean {
  return activeEditingSlideId !== null;
}

export function hasActiveSdmSelection(): boolean {
  return activeSelection;
}
