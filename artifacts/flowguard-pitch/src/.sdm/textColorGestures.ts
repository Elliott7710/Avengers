import { closeHistory } from 'prosemirror-history';
import { Mark } from 'prosemirror-model';
import {
  Plugin,
  PluginKey,
  type Selection,
  type Transaction,
} from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { SdmTextCommand } from './core/protocol';
import { setMarkerStyle, setRunStyle } from './core/text';

type StyleCommand = Extract<SdmTextCommand, { kind: 'setRunStyle' | 'setMarkerStyle' }>;

export function createTextColorGestures() {
  const key = new PluginKey('sdmTextColorGestures');
  const ended = new Set<string>();
  let active: {
    token: string;
    selection: Selection;
    changed: boolean;
  } | null = null;

  function close(transaction: Transaction): Transaction {
    if (active !== null) {
      ended.add(active.token);
      if (active.changed) {
        closeHistory(transaction);
      }
      active = null;
    }

    return transaction;
  }

  function end(view: EditorView, token?: string): void {
    if (token !== undefined) {
      ended.add(token);
    }
    if (active !== null && (token === undefined || token === active.token)) {
      view.dispatch(close(view.state.tr));
    }
  }

  const plugin = new Plugin({
    key,
    appendTransaction(transactions, _oldState, state) {
      const command: StyleCommand | undefined = transactions
        .find((transaction) => transaction.getMeta(key) !== undefined)
        ?.getMeta(key);
      if (command === undefined || active === null) {
        return null;
      }
      let update: Transaction | null = null;
      const applyStyle = command.kind === 'setRunStyle' ? setRunStyle : setMarkerStyle;
      applyStyle(command.style)(state, (transaction) => {
        if (
          transaction.doc.eq(state.doc) &&
          Mark.sameSet(
            transaction.storedMarks ?? transaction.selection.$from.marks(),
            state.storedMarks ?? state.selection.$from.marks(),
          )
        ) {
          return;
        }
        if (active !== null && !active.changed) {
          closeHistory(transaction);
          active.changed = true;
        }
        update = transaction;
      });

      return update;
    },
  });

  return {
    plugin,
    end,
    prepare(transaction: Transaction): Transaction {
      return transaction.getMeta(key) === undefined
        ? close(transaction)
        : transaction;
    },
    apply(view: EditorView, command: StyleCommand, token: string): boolean {
      if (ended.has(token)) {
        return true;
      }
      if (active !== null && active.token !== token) {
        end(view);
      }
      if (active !== null && !active.selection.eq(view.state.selection)) {
        end(view);

        return true;
      }
      active ??= {
        token,
        selection: view.state.selection,
        changed: false,
      };
      view.dispatch(view.state.tr.setMeta(key, command));

      return true;
    },
  };
}
