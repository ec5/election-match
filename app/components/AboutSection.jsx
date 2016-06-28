import React from 'react'

const AboutSection = () => {
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
        <li>
          <p>由於立法會所提供的公開數據除了議案標題外，並不包含議案摘要，可能以致一些議案因此被忽略。</p>
        </li>
        <li>
          <p>「配對結果」所使用的計分方法頗為簡單，或有不妥之處。如有對統計學比較熟悉的朋友，請不吝賜教。</p>
        </li>
      </ul>

      <h2 style={{marginTop: 50}}>關於本網</h2>
      <p className="lead">
        本網旨在透過數據分析，為選民提供多一項投票時的參考指標，從而希望選出最具代表性的議員。
      </p>
      <p className="lead">
        所用之投票資料來自
        <a href="http://www.legco.gov.hk/general/chinese/open-legco/open-data.html" rel="nofollow" target="_blank">立法會網站</a>，
        數據及源碼皆於 <a href="https://github.com/ec5/election-match/" rel="nofollow" target="_blank">Github 上公開</a>，
        歡迎指正錯漏或提出意見。
      </p>

      <h2 style={{marginTop: 50}}>緣起</h2>
      <p className="lead">
        經過不久前的立法會補選，忽然有一日反問自己是怎樣決定投票給誰的，出奇地發覺自己全依賴媒體上的資訊。
      </p>
      <p className="lead">
        除了候選人單方面宣傳的理念，難道就沒有更好的方法找出與自己理念相近的候選人嗎？為了解答這問題，就有了本網。
      </p>
      <p className="lead">
        實際製作之後，想了更多，發覺也有各樣限制（詳見「注意事項」），但願聊勝於無。
      </p>
    </section>
  )
}

export default AboutSection
