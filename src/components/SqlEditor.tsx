import React, { useState } from "react";
import { useSharedState } from "./StateContext";
import clsx from "clsx";
import { useTheme2 } from "@grafana/ui";

export interface SqlEditorProps {}

export const SqlEditor: React.FC<SqlEditorProps> = () => {
  const { userState, userDispatch } = useSharedState();

  const [textareaText, setTextAreaText] = useState(userState.sqlExpression as string)

  const theme = useTheme2();

  return (
    <>
      {userState.sqlEditorOpen ? (
        <div
          className={clsx(
            'flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-[3px]',
            theme.isDark ? 'bg-black/20' : 'bg-white/20'
          )}
        >
          <div className={clsx(
            'p-8 w-1/2 h-3/4 rounded-lg shadow-2xl flex flex-col gap-4 border-1',
            theme.isDark ? 'bg-black border-neutral-700' : 'bg-white text-neutral-600 border-neutral-100'
          )}>
            <span className="text-3xl font-bold uppercase">SQL Editor</span>
            <textarea
              onChange={e => setTextAreaText(e.target.value)}
              className={clsx(
                "block flex-grow !resize-none !font-mono !rounded-lg border-1 p-2",
                theme.isDark ? "border-neutral-700 bg-neutral-900" : "border-neutral-200 bg-neutral-50"
              )}
              spellCheck="false"
            >
        {userState.sqlExpression}
            </textarea>
            <div className="flex gap-2 justify-end content-center">
              <button
                className="px-4 py-2 !rounded-lg !text-white bg-red-700 !font-semibold"
                onClick={() => {userDispatch({type:"CLOSE_SQL_EDITOR"})}}
              >Cancel</button>
              <button
                className="px-4 py-2 !rounded-lg !text-white bg-emerald-600 !font-semibold"
                onClick={() => {userDispatch({type:"SET_SQL",payload:textareaText}); userDispatch({type:"CLOSE_SQL_EDITOR"})}}
              >Execute</button>
            </div>
          </div>
        </div>


      ) : (
        <>
        </>
      )}
    </>
  );
};
