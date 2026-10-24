import { InputRule, inputRules } from 'prosemirror-inputrules';

import {
  defaultRunStyleAttr,
  paragraphFromPmAttrs,
  runStyleFromMarks,
} from './pmDoc';
import { sdmTextSchema } from './pmSchema';

export function createSdmInputRules() {
  return inputRules({
    rules: [
      new InputRule(/^([-*]) $/, (state, match, start, end) => {
        const parent = state.doc.resolve(start).parent;
        if (
          !state.selection.empty ||
          parent.type !== sdmTextSchema.nodes.paragraph ||
          parent.attrs.bullet !== null
        ) {
          return null;
        }
        const marks = state.storedMarks ?? state.selection.$from.marks();
        const paragraph = paragraphFromPmAttrs(parent.attrs);

        return state.tr
          .delete(start, end)
          .setNodeMarkup(start - 1, undefined, {
            ...parent.attrs,
            bullet: {
              kind: 'character',
              character: match[1] === '-' ? '-' : '\u2022',
            },
            defaultRunStyle:
              parent.content.size === end - start
                ? defaultRunStyleAttr({
                    ...paragraph.defaultRunStyle,
                    ...runStyleFromMarks(marks),
                  })
                : parent.attrs.defaultRunStyle,
            synthetic: false,
          })
          .setStoredMarks(marks);
      }),
    ],
  });
}
