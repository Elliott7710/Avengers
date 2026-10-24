import { fontFamilyCss } from '../fonts';
import {
  SDM_DEFAULT_TEXT_SIZE_PT,
  SDM_POINT_TO_UNIT,
  type Color,
  type Font,
  type Paragraph,
  type RunStyle,
  type Theme,
} from '../schema';
import type { EffectiveParagraph } from './listStyles';
import { runStyleFromRun } from './pmDoc';

export interface SdmTextCssStyle {
  backgroundColor?: string;
  color?: string;
  display?: 'inline-block';
  fontFamily?: string;
  fontSize?: string;
  fontStyle?: 'italic' | 'normal';
  fontWeight?: number;
  letterSpacing?: string;
  lineHeight?: number;
  marginBottom?: string;
  marginTop?: string;
  minWidth?: string;
  overflowWrap?: 'break-word';
  paddingLeft?: string;
  textAlign?: Paragraph['align'];
  textDecoration?: string;
  textIndent?: string;
  whiteSpace?: 'pre-wrap';
}

function themeValue(
  record: Record<string, string> | undefined,
  token: string,
): string | undefined {
  return record !== undefined && Object.hasOwn(record, token)
    ? record[token]
    : undefined;
}

export function resolveTextColor(color: Color, theme?: Theme): string {
  if (color.kind === 'rgb') {
    return color.value;
  }

  return themeValue(theme?.colors, color.token) ?? '#000000';
}

export function resolveTextFont(
  font: Font | undefined,
  theme?: Theme,
): string | undefined {
  if (font === undefined) {
    return undefined;
  }
  const family =
    font.kind === 'family' ? font.family : themeValue(theme?.fonts, font.token);
  if (family === undefined) {
    return undefined;
  }

  return fontFamilyCss(family) ?? family;
}

export function runStylePropertyCss(
  style: Partial<RunStyle>,
  theme?: Theme,
): SdmTextCssStyle {
  const hasTextDecoration =
    Object.hasOwn(style, 'underline') || Object.hasOwn(style, 'strike');
  const fontStyle = style.italic ? 'italic' : 'normal';

  return {
    color:
      style.color === undefined
        ? undefined
        : resolveTextColor(style.color, theme),
    backgroundColor:
      style.highlight === undefined
        ? undefined
        : resolveTextColor(style.highlight, theme),
    // Assigning undefined to a DOM fontFamily creates the literal family "undefined".
    ...(style.font === undefined
      ? {}
      : { fontFamily: resolveTextFont(style.font, theme) }),
    fontSize:
      style.sizePt === undefined
        ? undefined
        : `${style.sizePt * SDM_POINT_TO_UNIT}px`,
    fontWeight: style.weight,
    fontStyle: style.italic === undefined ? undefined : fontStyle,
    textDecoration: hasTextDecoration
      ? [style.underline ? 'underline' : '', style.strike ? 'line-through' : '']
          .filter(Boolean)
          .join(' ') || 'none'
      : undefined,
    letterSpacing:
      style.letterSpacingPt === undefined
        ? undefined
        : `${style.letterSpacingPt * SDM_POINT_TO_UNIT}px`,
  };
}

export function effectiveRunStyleCss(
  style: RunStyle,
  theme?: Theme,
): SdmTextCssStyle {
  const sizePt = style.sizePt ?? SDM_DEFAULT_TEXT_SIZE_PT;

  return {
    fontSize: `${sizePt * SDM_POINT_TO_UNIT}px`,
    whiteSpace: 'pre-wrap',
    ...runStylePropertyCss({ ...style, sizePt }, theme),
  };
}

export function paragraphLayoutCss(
  paragraph: EffectiveParagraph,
): SdmTextCssStyle {
  return {
    textAlign: paragraph.align,
    lineHeight: paragraph.lineHeight,
    overflowWrap: 'break-word',
    paddingLeft:
      paragraph.indentPt === 0
        ? undefined
        : `${paragraph.indentPt * SDM_POINT_TO_UNIT}px`,
    textIndent:
      paragraph.hangingIndentPt === 0
        ? undefined
        : `${-paragraph.hangingIndentPt * SDM_POINT_TO_UNIT}px`,
    marginTop:
      paragraph.spaceBeforePt === 0
        ? undefined
        : `${paragraph.spaceBeforePt * SDM_POINT_TO_UNIT}px`,
    marginBottom:
      paragraph.spaceAfterPt === 0
        ? undefined
        : `${paragraph.spaceAfterPt * SDM_POINT_TO_UNIT}px`,
  };
}

export function paragraphMarkerStyle(paragraph: EffectiveParagraph): RunStyle {
  return {
    ...paragraph.defaultRunStyle,
    ...(paragraph.runs[0] === undefined
      ? {}
      : runStyleFromRun(paragraph.runs[0])),
    ...paragraph.markerStyle,
  };
}

export function paragraphMarkerCss(
  paragraph: EffectiveParagraph,
  theme?: Theme,
): SdmTextCssStyle {
  return {
    ...effectiveRunStyleCss(paragraphMarkerStyle(paragraph), theme),
    display: 'inline-block',
    minWidth: `${paragraph.hangingIndentPt * SDM_POINT_TO_UNIT}px`,
    textIndent: '0',
  };
}
