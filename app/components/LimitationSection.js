import React from 'react'

const LimitationSection = () => {
  return (
    <section className="container">
      <h2>注意事項</h2>
      <p className="lead">
        一如所有的評分機制很難做到全面客觀，依賴一至數項的數據分析結果，不宜作為<strong>唯一</strong>的投票依據。本網雖已儘量做得客觀，始終也有局限，在閱讀結果時應多加留意，不要盲目接受。
      </p>
      <ul>
        <li>
          <p>由於本網只有 2012 年至今的投票結果，對於2012 年以前的議員或新進的參選人無法作出分析。</p>
        </li>
        <li>
          <p>議員可能因為一些原因沒有投票，因此在投票數量比其他人少的情況下，「配對結果」的排序或會因而降低。例如：</p>
          <ul>
            <li>
              <p>立法會主席或會議主持人很少會投票。</p>
            </li>
            <li>
              <p>未完成任期或補選的議員。</p>
            </li>
          </ul>
        </li>
        <li>
          <p>議員可能在提出修正案或為表示支持某一修正案時，選擇不投票或反對，這或會讓配對結果出現誤差。</p>
        </li>
      </ul>
    </section>
  )
}

export default LimitationSection
