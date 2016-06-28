/* globals $,gapi,moment */
import _ from 'lodash'
import { render } from 'react-dom'
import React from 'react'
import Button from 'react-bootstrap/lib/Button'
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar'
import FormControl from 'react-bootstrap/lib/FormControl'
import Grid from 'react-bootstrap/lib/Grid'
import Panel from 'react-bootstrap/lib/Panel'
import ReactList from 'react-list'
import ScrollToTop from 'react-scroll-up'

import { DATE_FORMAT } from './motion'
import { getCurrentNav } from './util'
import {
  initialStateFromUrl,
  minDateSelector,
  maxDateSelector,
  activeTabSelector,
  votedCountSelector,
  isAllVotedSelector,
  canShareSelector,
  filterMotionsSelector,
  votedMotionsSelector,
  votedStatsSelector,
  matchResultSelector,
  canShareMotionsSelector,
  motionsShareUrlSelector,
  motionsShortUrlSelector,
  canShareVotedSelector,
  votedShortUrlSelector,
  votedShareUrlSelector,
} from './selectors'
import AboutSection from './components/AboutSection'
import DateRangeFilter from './components/DateRangeFilter'
import GenerateShareUrl from './components/GenerateShareUrl'
import PageNavbar from './components/PageNavbar'
import renderMotionVote from './components/renderMotionVote'
import ScoreForm from './components/ScoreForm'
import ScoreFormGroup from './components/ScoreFormGroup'

const GOOGLE_CLIENT_LOADED_EVENT = 'googleClientLoaded'

const defaultScoreVars = {
  yes: 1,
  no: 1,
  opposite: -1,
  novote: 0,
}


class ElectionMatch extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 1,
      scoreVars: defaultScoreVars,
      ...initialStateFromUrl(),
      filterText: '',
      isGoogleClientLoaded: false,
    }
  }

  componentDidMount() {
    $(window).on(GOOGLE_CLIENT_LOADED_EVENT, () => {
      this.setState({
        isGoogleClientLoaded: true,
      })
    })
    .on('hashchange', (event) => {
      this.setState({
        currentNav: getCurrentNav(),
      })
    })
    $.getJSON('data.json', (data) => {
      _.each(data.motions, (motion, motionId) => {
        motion.id = motionId  // eslint-disable-line
        motion.group = `${motion.meetingType} - ${motion.voteDate}`   // eslint-disable-line
        motion.voteDateMoment = moment(motion.voteDate, DATE_FORMAT)  // eslint-disable-line
      })

      this.setState({
        data,
        startDate: moment(maxDateSelector({ data })).add(-6, 'months'),
        endDate: maxDateSelector({ data }),
      })
    })
  }

  renderAboutSection() {
    return <AboutSection />
  }

  renderFilterVotesTab = () => {
    const { data, voted, startDate, endDate } = this.state
    const motions = filterMotionsSelector(this.state)
    return (
      <div>
        <h3>假如你是立法會議員，你會如何投票？<small>根據你的投票，找到相近似的議員</small></h3>
        <p className="lead">共 {_.size(data.motions)} 個議案，最近更新：{maxDateSelector(this.state).format(DATE_FORMAT)}。</p>
        <DateRangeFilter
          minDate={minDateSelector(this.state)}
          maxDate={maxDateSelector(this.state)}
          startDate={startDate}
          endDate={endDate}
          onChange={(event, picker) => {
            const [startDate, endDate] = _.map(_.split(event.target.value, ' - '), (x) => moment(x, DATE_FORMAT))
            this.setState({
              startDate,
              endDate,
            })
          }}
          />
        <FormControl
          type="text"
          placeholder="輸入關鍵字篩選"
          value={this.state.filterText}
          onChange={(event) => this.setState({ filterText: event.target.value })}
          />
        {_.isEmpty(motions) ? <p className="text-warning">沒有議案可投票</p> : (
          <ReactList
            itemRenderer={renderMotionVote({
              motions,
              voted,
              onVoteYes: this.onVote('yes'),
              onVoteNo: this.onVote('no'),
              onRemoveMotion: this.onRemoveMotion,
            })}
            length={motions.length}
            type="simple"
            />
        )}
      </div>
    )
  }

  renderSelectedVotesTab = () => {
    const { voted } = this.state
    const motions = votedMotionsSelector(this.state)
    const votedStats = votedStatsSelector(this.state)
    return (
      <div>
        {_.isEmpty(motions) ? <p className="text-warning">未有投票</p> : (
          <ReactList
            itemRenderer={renderMotionVote({
              motions,
              voted,
              onVoteYes: this.onVote('yes'),
              onVoteNo: this.onVote('no'),
              onRemoveMotion: this.onRemoveMotion,
            })}
            length={motions.length}
            type="simple"
            />
        )}
        <ButtonToolbar style={{ padding: '16px 0' }}>
          {votedStats[null] ? (
            <Button onClick={this.onRemoveEmptyMotions} className="pull-right">
              移除 {votedStats[null]} 個未投票議案
            </Button>
          ) : (
            <Button
              bsStyle="primary"
              onClick={() => this.setState({ activeTab: 3 })}
              className="pull-right"
              >
              看「配對結果」
            </Button>
          )}
        </ButtonToolbar>
      </div>
    )
  }

  renderResultTab = () => {
    const { scoreVars } = this.state
    const matchResult = matchResultSelector(this.state)
    const title = <h3>計分方法</h3>
    const defaultExpanded = !_.isEqual(scoreVars, defaultScoreVars)
    return (
      <div>
        <ScoreForm title={title} defaultExpanded={defaultExpanded}>
          <ScoreFormGroup title="相同贊成" value={scoreVars.yes} onChange={this.onScoreVarsChange('yes')} />
          <ScoreFormGroup title="相同反對" value={scoreVars.no} onChange={this.onScoreVarsChange('no')} />
          <ScoreFormGroup title="相反投票" value={scoreVars.opposite} onChange={this.onScoreVarsChange('opposite')} />
          <ScoreFormGroup title="沒有投票" value={scoreVars.novote} onChange={this.onScoreVarsChange('novote')} />
        </ScoreForm>
        <div className="table-responsive">
          <table className="table table-striped table-hover table-condensed">
            <thead>
              <tr>
                <th>議員</th>
                <th>相似分數</th>
                <th>相同投票</th>
                <th>相反投票</th>
                <th>相同贊成</th>
                <th>相同反對</th>
                <th>沒有投票</th>
              </tr>
            </thead>
            <tbody>
              {_.map(matchResult, (member, i) => {
                return (
                  <tr key={i}>
                    <td>{member.name}</td>
                    <td>{member.matching.score}</td>
                    <td>{member.matching.yes + member.matching.no}</td>
                    <td>{member.matching.opposite}</td>
                    <td>{member.matching.yes}</td>
                    <td>{member.matching.no}</td>
                    <td>{member.matching.novote}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ padding: 16 }}>
                  <p>
                    註：作為負責任的選民，不應只靠單一資訊投票，請參閱「<a href="#limitation">注意事項</a>」瞭解本網的一些限制。
                  </p>
                </td>
              </tr>
            </tfoot>
          </table>
          <ButtonToolbar style={{ padding: '16px 0' }}>
            <Button
              bsStyle="primary"
              onClick={() => this.setState({ activeTab: 4 })}
              className="pull-right"
              >
              複製分享連結
            </Button>
          </ButtonToolbar>
        </div>
      </div>
    )
  }

  renderShareTab() {
    const titleStyle = {
      marginBottom: 10,
    }
    return (
      <div>
        <Panel>
          {canShareMotionsSelector(this.state) && (
            <div>
              <p className="lead" style={titleStyle}>分享你已選取的議案</p>
              <p>對方只會看到議案表格，看不到你的投票，適合讓你的朋友就你關心的議題分享看法。</p>
              <GenerateShareUrl
                url={motionsShareUrlSelector(this.state)}
                shortUrl={motionsShortUrlSelector(this.state)}
                onGenerateShortUrl={this.onGenerateShortUrl}
                /><br />
            </div>
          )}
          {canShareVotedSelector(this.state) && (
            <div>
              <p className="lead" style={titleStyle}>分享你的配對結果</p>
              <p>對方會看到你的投票及配對結果，適合讓你的朋友知道你對一些議題的看法。</p>
              <GenerateShareUrl
                url={votedShareUrlSelector(this.state)}
                shortUrl={votedShortUrlSelector(this.state)}
                onGenerateShortUrl={this.onGenerateShortUrl}
                />
            </div>
          )}
        </Panel>
      </div>
    )
  }

  onScoreVarsChange(key) {
    return (event) => {
      const { scoreVars } = this.state
      this.setState({ scoreVars: {
        ...scoreVars,
        [key]: _.toSafeInteger(event.target.value),
      }})
    }
  }

  onVote(vote) {
    return (motion) => {
      const { voted } = this.state
      this.setState({ voted: {
        ...voted,
        [motion.id]: vote,
      }})
    }
  }

  onGenerateShortUrl = (longUrl, callback) => {
    gapi.client.urlshortener.url.insert({
      resource: { longUrl },
    })
    .execute((response) => {
      const shortUrl = response.id
      if (shortUrl) {
        const { shortUrls } = this.state
        this.setState({
          shortUrls: {
            ...shortUrls,
            [longUrl]: shortUrl,
          },
        })
        if (_.isFunction(callback)) {
          callback({ shortUrl })
        }
      }
    })
  }

  onRemoveMotion = (motionId) => {
    const voted = _.omit(this.state.voted, motionId)
    this.setState({
      voted,
    })
  }

  onRemoveEmptyMotions = () => {
    const voted = _.omitBy(this.state.voted, _.isEmpty)
    this.setState({
      voted,
    })
  }

  render() {
    const { currentNav, data } = this.state
    const activeTab = currentNav === 'about' || currentNav === 'limitation' ? 5 : activeTabSelector(this.state)
    if (!data) {
      return <div>載入議案資料中⋯⋯</div>
    }
    const upStyle = {
      position: 'fixed',
      bottom: 30,
      right: 0,
      cursor: 'pointer',
      transitionDuration: '0.2s',
      transitionTimingFunction: 'linear',
      transitionDelay: '0s',
    }
    return (
      <div style={{paddingBottom: 60}}>
        <PageNavbar
          activeTab={activeTab}
          onSelectTab={(eventKey) => this.setState({ activeTab: eventKey })}
          votedCount={votedCountSelector(this.state)}
          isAllVoted={isAllVotedSelector(this.state)}
          canShare={canShareSelector(this.state)}
          />
        <Grid>
          {[
            this.renderFilterVotesTab,
            this.renderSelectedVotesTab,
            this.renderResultTab,
            this.renderShareTab,
            this.renderAboutSection,
          ][activeTab - 1].call(this)}
        </Grid>
        <ScrollToTop showUnder={160} style={upStyle}>
          <img src="/images/up.png" alt="移至頂部" />
        </ScrollToTop>
      </div>
    )
  }
}


const initGoogleClient = () => {
  const apiKey = 'AIzaSyA8f91lvLDPchAInQKcjWX4LXjAiJbDEHo'
  gapi.client.setApiKey(apiKey)
  gapi.client.load('urlshortener', 'v1', () => {
    $(window).trigger(GOOGLE_CLIENT_LOADED_EVENT)
  })
}
window.initGoogleClient = initGoogleClient

document.addEventListener('DOMContentLoaded', () => {
  render(<ElectionMatch />, document.getElementById('app'))
})
