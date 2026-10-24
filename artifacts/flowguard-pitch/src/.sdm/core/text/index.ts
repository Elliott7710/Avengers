/* oxlint-disable @replit/web/no-barrel-file -- package subpath entry: @replit/sdm-core/text is consumed as one module and mirrored file-by-file into the slides artifact */
export {
  formattingContinuityPlugin,
  initializeFormattingContinuity,
} from './formattingContinuity';
export { createSdmInputRules } from './inputRules';
export {
  effectiveRunStyleCss,
  paragraphLayoutCss,
  paragraphMarkerCss,
  paragraphMarkerStyle,
  resolveTextColor,
  resolveTextFont,
  runStylePropertyCss,
} from './inlineStyles';
export { SDM_DEFAULT_LIST_INDENT_PT, effectiveParagraph } from './listStyles';
export {
  createParagraphMarkerPlugin,
  paragraphMarkers,
} from './paragraphMarkers';
export {
  backspaceParagraphFormatting,
  indentParagraphs,
  insertSdmLineBreak,
  outdentParagraphs,
  setBulletProperties,
  setMarkerStyle,
  setParagraphAlignment,
  setParagraphSpacing,
  setRunStyle,
  splitSdmParagraph,
  toggleCharacterBullets,
  toggleNumberedBullets,
} from './pmCommands';
export {
  canonicalizeRunStyle,
  canonicalizeTextBody,
  docToTextBody,
  docToTextBodyWithReuse,
  paragraphFromPmAttrs,
  runStyleFromMarks,
  runStyleFromRun,
  textBodyToDoc,
} from './pmDoc';
export { sdmTextSchema } from './pmSchema';
export { deepEqual, runStyleOverrides } from './styleUtils';
export {
  selectionFormatting,
  type SdmSelectionFormatting,
} from './selectionFormatting';
