import React from 'react'

const AboutSection = () => {
  return (
    <section className="container">
      <h2>關於本網</h2>
      <p className="lead">
        本網旨在透過數據分析，為選民提供多一項投票時的參考指標，從而希望選出最具代表性的議員。
      </p>
      <p className="lead">
        所用之投票資料來自
        <a href="http://www.legco.gov.hk/general/chinese/open-legco/open-data.html" rel="nofollow" target="_blank">立法會網站</a>，
        數據及源碼皆於 <a href="https://github.com/ec5/election-match/" rel="nofollow" target="_blank">Github 上公開</a>，
        歡迎指正錯漏或提出意見。
      </p>
      <h2>緣起</h2>
      <p className="lead">
        經過不久前的立法會補選，忽然有一日反問自己是怎樣決定投票給誰的，出奇地發覺自己全依賴媒體上的資訊。
      </p>
      <p className="lead">
        除了候選人單方面宣傳的理念，難道就沒有更好的方法找出與自己理念相近的候選人嗎？為了解答這問題，就有了本網。
      </p>
      <p className="lead">
        實際製作之後，想了更多，發覺也有各樣限制（詳見「<a href="#limitation">注意事項</a>」），但願聊勝於無。
      </p>
    </section>
  )
}

export default AboutSection
