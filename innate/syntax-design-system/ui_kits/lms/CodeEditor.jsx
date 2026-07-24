// Code-editor / assignment screen. Tabs, line-numbered editor, examples, tests, companion hint.
function CodeEditor({ onBack }) {
  const Icon = window.Icon;
  const [tab, setTab] = React.useState('description');
  const [bubble, setBubble] = React.useState(true);

  const code = [
    '<span class="tok-k">from</span> typing <span class="tok-k">import</span> <span class="tok-t">Optional</span>',
    '',
    '',
    '<span class="tok-k">class</span> <span class="tok-t">Solution</span>:',
    '    <span class="tok-k">def</span> <span class="tok-fn">length_of_longest_substring</span>(self, s: <span class="tok-t">str</span>) -&gt; <span class="tok-t">int</span>:',
    '        <span class="tok-c"># sliding window with a set</span>',
    '        seen = <span class="tok-t">set</span>()',
    '        left = <span class="tok-t">0</span>',
    '        best = <span class="tok-t">0</span>',
    '',
    '        <span class="tok-k">for</span> right, ch <span class="tok-k">in</span> <span class="tok-fn">enumerate</span>(s):',
    '            <span class="tok-c"># TODO: shrink window when ch is already in seen</span>',
    '            seen.add(ch)',
    '            best = <span class="tok-fn">max</span>(best, right - left + <span class="tok-t">1</span>)',
    '',
    '        <span class="tok-k">return</span> best',
  ];

  const examples = [
    { h: 'Example 1 · Typical', rows: [['Input', 's = "abcabcbb"'], ['Output', '3'], ['Note', 'The answer is "abc", with length 3.']] },
    { h: 'Example 2 · All same', rows: [['Input', 's = "bbbbb"'], ['Output', '1'], ['Note', 'The answer is "b".']] },
    { h: 'Example 3 · Empty', rows: [['Input', 's = ""'], ['Output', '0']] },
  ];

  const tabs = [['description', 'Description', 'file-text'], ['solution', 'Solution', 'bookmark'], ['hint', 'Hints', 'help-circle'], ['submissions', 'Submissions', 'clock']];

  return (
    <div className="editor">
      <div className="editor__top">
        <span className="editor__back" onClick={onBack}><Icon name="chevron-left" size={16} /> Back to dashboard</span>
        <div className="editor__title">
          Assignment 1 of 5
          <span className="timer-pill"><Icon name="clock" size={15} /> 00:20:00</span>
        </div>
        <div className="editor__topright">
          <button className="editor__navbtn"><Icon name="arrow-left" size={16} /></button>
          <button className="editor__navbtn"><Icon name="arrow-right" size={16} /></button>
        </div>
      </div>

      <div className="editor__body">
        {/* LEFT */}
        <div className="editor__left">
          <div className="editor__tabs">
            {tabs.map(([id, label, icon]) => (
              <span key={id} className={'editor__tab' + (tab === id ? ' is-active' : '')} onClick={() => setTab(id)}>
                <Icon name={icon} size={15} /> {label}
              </span>
            ))}
            <span className="editor__tabspacer" />
            <span className="fs-btn"><Icon name="panel-left" size={16} /></span>
          </div>

          {tab === 'description' ? (
            <div className="editor__desc">
              <div className="problem-tags">
                <span className="chip">Python</span>
                <span className="chip">Medium Difficulty</span>
                <span className="chip">Max Score: 100</span>
              </div>
              <h1 className="problem-h">Longest substring without repeating characters</h1>
              <p className="problem-p">Given a string <code>s</code>, find the length of the longest substring that contains no repeating characters.</p>
              <h3 className="examples-h">Examples</h3>
              {examples.map((ex, i) => (
                <div className="example" key={i}>
                  <div className="example__h">{ex.h}</div>
                  {ex.rows.map(([k, v], j) => (
                    <div className="example__row" key={j}>
                      <div className="example__k">{k}</div>
                      <div className="example__v">{v}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : tab === 'hint' ? (
            <div className="editor__desc">
              <div className="hints-moved">
                <img src={window.LMS_MASCOT} alt="Companion" />
                <div className="hints-moved__tail" />
                <div className="hints-moved__box">
                  <div className="hints-moved__eyebrow">Hints have moved</div>
                  <div className="hints-moved__title">Find hints for this problem in your AI Companion</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="editor__desc">
              <div className="example" style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 14 }}>Nothing here yet.</div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="editor__right">
          <div className="editor__toolbar">
            <div className="lang-select">Python 3 (3.10) <Icon name="chevron-down" size={16} /></div>
            <span className="saved-badge"><Icon name="check" size={14} /> Saved 6 sec ago</span>
            <span className="fs-btn"><Icon name="maximize" size={16} /></span>
          </div>
          <div className="code">
            <div className="code__gutter">{code.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
            <div className="code__src">{code.map((ln, i) => (
              <span key={i} style={{ display: 'block', minHeight: '1.75em' }} dangerouslySetInnerHTML={{ __html: ln || '&nbsp;' }} />
            ))}</div>
          </div>

          {tab === 'hint' && bubble ? (
            <div className="companion-bubble">
              <span className="x" onClick={() => setBubble(false)}><Icon name="x" size={14} /></span>
              Hello Kishan, feeling stuck? I can give you a hint!
            </div>
          ) : null}
          <div className="companion-fab" onClick={() => setBubble(true)}><img src={window.LMS_MASCOT} alt="Companion" /></div>

          <div className="editor__tests">
            <div className="tests-head">Test cases <span className="chev"><Icon name="chevron-down" size={18} /></span></div>
          </div>
          <div className="editor__actions">
            <button className="run-btn"><Icon name="play" size={15} /> Run</button>
            <button className="run-btn">Run with Custom Input</button>
            <button className="submit-btn">Submit <Icon name="arrow-right" size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.CodeEditor = CodeEditor;
