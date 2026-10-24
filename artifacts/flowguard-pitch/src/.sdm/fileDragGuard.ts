const isFileDrag = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

const postFileDragHint = (hint: 'sdm:fileDragOver' | 'sdm:fileDragEnd') => {
  if (window.parent !== window) {
    window.parent.postMessage(hint, '*');
  }
};

export function installFileDragGuard(): void {
  window.addEventListener('dragover', (event) => {
    if (isFileDrag(event)) {
      event.preventDefault();
      postFileDragHint('sdm:fileDragOver');
    }
  });
  window.addEventListener('drop', (event) => {
    if (isFileDrag(event)) {
      event.preventDefault();
      postFileDragHint('sdm:fileDragEnd');
    }
  });
  window.addEventListener('dragleave', (event) => {
    if (isFileDrag(event) && event.relatedTarget === null) {
      postFileDragHint('sdm:fileDragEnd');
    }
  });
}
