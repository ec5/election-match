/* globals $,gapi,moment */
import url from 'url'

import _ from 'lodash'
import base64 from 'base64-js'
import Fuse from 'fuse.js'
import pako from 'pako'
import queryString from 'query-string'
import copyToClipboard from 'copy-to-clipboard'

import { createSelector } from 'reselect'
import { render } from 'react-dom'
import React, { Component } from 'react'

import Badge from 'react-bootstrap/lib/Badge'
import Button from 'react-bootstrap/lib/Button'
import Clearfix from 'react-bootstrap/lib/Clearfix'
import FormControl from 'react-bootstrap/lib/FormControl'
import FormGroup from 'react-bootstrap/lib/FormGroup'
import InputGroup from 'react-bootstrap/lib/InputGroup'
import Nav from 'react-bootstrap/lib/Nav'
import Navbar from 'react-bootstrap/lib/Navbar'
import NavItem from 'react-bootstrap/lib/NavItem'
import Panel from 'react-bootstrap/lib/Panel'

import ReactList from 'react-list'
import ScrollToTop from 'react-scroll-up'

const DATE_FORMAT = 'DD/MM/YYYY'
const GOOGLE_CLIENT_LOADED_EVENT = 'googleClientLoaded'
const scoreAdjustment = {
  yes: 1,
  no: 1,
  opposite: -1,
  novote: 0,
}

const compress = (obj) => base64.fromByteArray(pako.deflate(JSON.stringify({
  _v: 1,
  data: obj,
}), {
  level: 9,
  memLevel: 9,
}))

const decompress = (s) => {
  try {
    return JSON.parse(pako.inflate(base64.toByteArray(s), { to: 'string' }))
  } catch (err) {
    console.error(err)
    return null
  }
}

const buildUrl = (query) => {
  const urlObj = url.parse(window.location.href)
  delete urlObj.search
  urlObj.query = query
  return url.format(urlObj)
}

const convertMotionIdsToVoted = () => _.reduce(motionIds, (r, motionId) => {
  r[motionId] = null
  return r
}, {})

const initialStateFromUrl = () => {
    const { v, m } = queryString.parse(window.location.search)
    if (v) {
      const voted = _.get(decompress(v), 'data')
      return {
        activeTab: isAllVotedSelector({ voted }) ? 3 : 2,
        voted,
      }
    }
    if (m) {
      const motionIds = _.get(decompress(m), 'data')
      return {
        activeTab: 2,
        voted: convertMotionIdsToVoted(motionIds),
      }
    }
    return {}
}

const getShortUrl = (longUrl, shortUrls) => _.get(shortUrls, [longUrl])

const votedSelector = state => state.voted
const shortUrlsSelector = state => state.shortUrls

const motionsShareUrlSelector = createSelector(
  votedSelector,
  shortUrlsSelector,
  (voted, shortUrls) => {
    return buildUrl({
      m: compress(_.keys(voted)),
    })
  }
)

const motionsShortUrlSelector = createSelector(
  motionsShareUrlSelector,
  shortUrlsSelector,
  getShortUrl
)

const votedShareUrlSelector = createSelector(
  votedSelector,
  shortUrlsSelector,
  (voted, shortUrls) => {
    return buildUrl({
      v: compress(voted),
    })
  }
)

const votedShortUrlSelector = createSelector(
  votedShareUrlSelector,
  shortUrlsSelector,
  getShortUrl
)

const canShareSelector = createSelector(
  votedSelector,
  votedShareUrlSelector,
  (voted, url) => {
    return !_.isEmpty(voted) && _.size(url) < 2048
  }
)

const fuseSelector = createSelector(
  state => state.data.motions,
  (motions) => {
    return new Fuse(_.values(motions), { keys: ['title'] })
  }
)

const filterMotionsSelector = createSelector(
  state => state.data.motions,
  state => state.startDate,
  state => state.endDate,
  state => state.filterText,
  fuseSelector,
  (motions, startDate, endDate, filterText, fuse) => {
    const searchResult = _.isEmpty(filterText) ? motions : fuse.search(filterText)
    const filteredMotions = _.filter(searchResult, (motion) => {
      return motion.voteDateMoment.isBetween(startDate, endDate)
    })
    return filteredMotions
  }
)

const votedMotionsSelector = createSelector(
  state => state.data.motions,
  votedSelector,
  (motions, voted) => _.filter(motions, (motion) => {
    return !_.isUndefined(_.get(voted, [motion.id]))
  })
)

const getOppositeVote = (vote) => {
  return {
    'yes': 'no',
    'no': 'yes',
  }[vote]
}

const matchResultSelector = createSelector(
  state => state.data.motions,
  votedSelector,
  state => state.data.members,
  (motions, voted, members) => {
    return _.sortBy(_.map(members, (member, memberName) => {
      const matching = _.reduce(voted, (r, vote, motionId) => {
        const memberVote = member.votes[motionId]
        if (memberVote === vote) {
          r.score += scoreAdjustment[vote]
          r[vote] += 1
        } else if (memberVote === getOppositeVote(vote)) {
          r.score += scoreAdjustment['opposite']
          r['opposite'] += 1
        } else if (memberVote) {
          r.score += scoreAdjustment['novote']
          r['novote'] += 1
          r[memberVote] += 1
        }
        return r
      }, {
        yes: 0,
        no: 0,
        opposite: 0,
        novote: 0,
        absent: 0,
        present: 0,
        abstain: 0,
        score: 0,
      })
      return {
        name: memberName,
        matching,
      }
    }), (x) => x.matching.score * -1)
  }
)

const motionDatesSelector = createSelector(
  state => state.data.motions,
  (motions) => _.map(motions, 'voteDateMoment')
)

const maxDateSelector = createSelector(
  motionDatesSelector,
  motionDates => _.max(motionDates)
)

const minDateSelector = createSelector(
  motionDatesSelector,
  motionDates => _.min(motionDates)
)

const votedCountSelector = createSelector(
  votedSelector,
  (voted) => _.size(voted)
)

const isAllVotedSelector = createSelector(
  votedSelector,
  (voted) => _.every(voted, Boolean)
)

class DateRangeFilter extends Component {
  componentDidMount() {
    $(this._input).daterangepicker({
      autoApply: true,
      locale: {
        format: DATE_FORMAT,
      },
      ..._.pick(this.props, [
        'startDate', 'endDate',
        'minDate', 'maxDate',
      ])
    })
    .on('apply.daterangepicker', this.props.onApply)
  }

  render() {
    return (
      <input
        ref={(c) => this._input = c}
        type="text"
        name="datefilter"
        className="form-control"
      />
    )
  }
}

const CloseButton = ({ onClick }) => {
  return (
    <button
      type="button"
      className="close pull-right"
      ariaLabel="Close"
      onClick={onClick}
    >
      <span ariaHidden="true">&times;</span>
    </button>
  )
}

const renderMotionVote = ({ motions, voted, onVoteYes, onVoteNo, onRemoveMotion }) => (i) => {
  const motion = motions[i]
  return (
    <div key={i} className="form-group list-group-item lead">
      <h4 className="list-group-item-heading">
        <Clearfix style={{margin: '0.5rem 0 1.5rem'}}>
          {_.has(voted, motion.id) && <CloseButton onClick={() => onRemoveMotion(motion.id)} />}
          <small style={{lineHeight: '1.9rem'}}>{motion.voteDate}</small>
        </Clearfix>
        {motion.title}
      </h4>
      <label className="radio-inline">
        <input
          type="radio"
          name={motion.id}
          value="yes"
          onChange={() => onVoteYes(motion)}
          checked={_.get(voted, motion.id) === 'yes'}
        /> 贊成
      </label>
      <label className="radio-inline">
        <input
          type="radio"
          name={motion.id}
          value="no"
          onChange={() => onVoteNo(motion)}
          checked={_.get(voted, motion.id) === 'no'}
        /> 反對
      </label>
    </div>
  )
}

const VoteSectionHeader = ({ activeTab, onSelectTab, votedCount, isAllVoted }) => {
  const showResult = votedCount > 0 && isAllVoted
  return (
    <header>
      <h2>議案投票</h2>
      <p className="lead">假如你是立法會議員，你會如何投票？</p>
      <Nav bsStyle="tabs" activeKey={activeTab} onSelect={onSelectTab} justified={true}>
        <NavItem eventKey={1}>選取議案</NavItem>
        <NavItem eventKey={2} disabled={votedCount === 0}>
          你的投票{' '}
          <Badge className={showResult ? 'alert-success' : ''}>{votedCount}</Badge>
        </NavItem>
        <NavItem eventKey={3} disabled={!showResult}>配對結果</NavItem>
      </Nav>
    </header>
  )
}

const copyToClipboardSafely = (shortUrl) => {
  try {
    copyToClipboard(shortUrl)
  } catch (ex) {
  }
}

const GenerateShareUrl = ({ url, shortUrl, onGenerateShortUrl }) => {
  return (
    <form onSubmit={(event) => {
        event.preventDefault()
        if (shortUrl) {
          copyToClipboardSafely(shortUrl)
        } else {
          onGenerateShortUrl(url, (res) => {
            copyToClipboardSafely(res.shortUrl)
          })
        }
      }}>
      <FormGroup>
        <InputGroup>
          <FormControl
            type="text"
            value={shortUrl || url}
            readOnly={true}
            style={{textOverflow: 'ellipsis'}}
          />
          <InputGroup.Button>
            <Button type="submit">複製短網址</Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    </form>
  )
}

const PageNavbar = () => {
  return (
    <Navbar fixedTop>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="#">立法會投票傾向配對</a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
      <Navbar.Collapse>
        <Nav>
          <NavItem eventKey="stats" href="#stats">數據統計</NavItem>
          <NavItem eventKey="vote" href="#about">關於</NavItem>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

class ElectionMatch extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 1,
      currentNav: '',
      filterText: '',
      isGoogleClientLoaded: false,
      ...initialStateFromUrl(),
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
        currentNav: _.trimStart(window.location.hash, '#')
      })
    })
    $.getJSON('data.json', (data) => {
      _.each(data.motions, (motion, motionId) => {
        motion.id = motionId
        motion.group = `${motion.meetingType} - ${motion.voteDate}`
        motion.voteDateMoment = moment(motion.voteDate, DATE_FORMAT)
      })

      this.setState({
        data,
        startDate: minDateSelector({ data }),
        endDate: maxDateSelector({ data }),
      })
    })
  }

  render() {
    const { currentNav, data, activeTab, voted } = this.state
    if (!data) {
      return <div>載入議案資料中⋯⋯</div>
    }
    return (
      <div style={{paddingTop: 50}}>
        <PageNavbar />
          {{
            '': this.renderMainSection,
            'stats': this.renderStatsSection,
            'about': this.renderAboutSection,
          }[currentNav].call(this)}
        <ScrollToTop showUnder={160}>
          <span>移至頂部</span>
        </ScrollToTop>
      </div>
    )
  }

  renderMainSection() {
    const { data, activeTab, voted } = this.state
    return (
      <section>
        <VoteSectionHeader
          activeTab={activeTab}
          onSelectTab={(eventKey) => this.setState({ activeTab: eventKey })}
          votedCount={votedCountSelector(this.state)}
          isAllVoted={isAllVotedSelector(this.state)}
        />
        {[
          this.renderFilterVotesTab,
          this.renderSelectedVotesTab,
          this.renderResultTab,
        ][activeTab - 1].call(this)}
      </section>
    )
  }

  renderStatsSection() {
    return (
      <div>stats</div>
    )
  }

  renderAboutSection() {
    return (
      <div>about</div>
    )
  }

  renderFilterVotesTab = () => {
    const { data, voted, startDate, endDate } = this.state
    const motions = filterMotionsSelector(this.state)
    return (
      <Panel>
        <p className="lead">共 {_.size(data.motions)} 個議案，最近更新：{maxDateSelector(this.state).format(DATE_FORMAT)}。</p>
        <DateRangeFilter
          minDate={minDateSelector(this.state)}
          maxDate={maxDateSelector(this.state)}
          startDate={startDate}
          endDate={endDate}
          onApply={(ev, picker) => {
            this.setState({
              startDate: picker.startDate,
              endDate: picker.endDate,
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
            type='simple'
          />
        )}
      </Panel>
    )
  }

  renderSelectedVotesTab = () => {
    const { voted } = this.state
    const motions = votedMotionsSelector(this.state)
    return (
      <div>
        {canShareSelector(this.state) && (
          <GenerateShareUrl
            url={motionsShareUrlSelector(this.state)}
            shortUrl={motionsShortUrlSelector(this.state)}
            onGenerateShortUrl={this.onGenerateShortUrl}
          />
        )}
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
            type='simple'
          />
        )}
      </div>
    )
  }

  renderResultTab = () => {
    const matchResult = matchResultSelector(this.state)
    return (
      <div className="table-responsive">
        {canShareSelector(this.state) && (
          <GenerateShareUrl
            url={votedShareUrlSelector(this.state)}
            shortUrl={votedShortUrlSelector(this.state)}
            onGenerateShortUrl={this.onGenerateShortUrl}
          />
        )}
        <table className="table table-striped table-hover table-condensed">
          <thead>
            <tr>
              <th>議員</th>
              <th>相似分數</th>
              <th>相同投票</th>
              <th>相反投票</th>
              <th>相同贊成</th>
              <th>相同反對</th>
              <th>沒有表態</th>
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
        </table>
      </div>
    )
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
          }
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
      activeTab: _.isEmpty(voted) ? 1 : this.state.activeTab,
    })
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
