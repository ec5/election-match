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
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar'
import Clearfix from 'react-bootstrap/lib/Clearfix'
import ControlLabel from 'react-bootstrap/lib/ControlLabel'
import DropdownButton from 'react-bootstrap/lib/DropdownButton'
import FormControl from 'react-bootstrap/lib/FormControl'
import FormGroup from 'react-bootstrap/lib/FormGroup'
import Grid from 'react-bootstrap/lib/Grid'
import InputGroup from 'react-bootstrap/lib/InputGroup'
import MenuItem from 'react-bootstrap/lib/MenuItem'
import Nav from 'react-bootstrap/lib/Nav'
import Navbar from 'react-bootstrap/lib/Navbar'
import NavItem from 'react-bootstrap/lib/NavItem'
import Panel from 'react-bootstrap/lib/Panel'

import ReactList from 'react-list'
import ScrollToTop from 'react-scroll-up'

import { DATE_FORMAT, getUrls } from './motion'
import AboutSection from './components/AboutSection'
import LimitationSection from './components/LimitationSection'

const GOOGLE_CLIENT_LOADED_EVENT = 'googleClientLoaded'

const compress = (obj) => base64.fromByteArray(pako.deflate(JSON.stringify({
  ...obj,
  _v: 2,
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
  urlObj.hash = ''
  urlObj.query = query
  return url.format(urlObj)
}

const buildShareUrl = (obj) => {
  return buildUrl({
    s: compress(obj),
  })
}

const convertMotionIdsToVoted = (motionIds) => _.reduce(motionIds, (r, motionId) => {
  r[motionId] = null
  return r
}, {})

const getCurrentNav = () => {
  const hash = _.trimStart(window.location.hash, '#')
  switch (hash) {
    case 'about':
    case 'limitation':
    case 'stats':
      return hash
    default:
      return 'vote'
  }
}

const initialStateFromUrl = () => {
    const { s } = queryString.parse(window.location.search)
    const state = s ? decompress(s) : {}
    console.log('state', state)
    const motionIds = _.get(state, 'motionIds')
    if (motionIds) {
      state.voted = convertMotionIdsToVoted(motionIds)
    }
    if (!_.isEmpty(state)) {
      state.activeTab = isAllVotedSelector(state) ? 3 : 2
    }
    return {
      ..._.omit(state, ['_v', 'motionIds']),
      currentNav: getCurrentNav(),
    }
}

const getShortUrl = (longUrl, shortUrls) => _.get(shortUrls, [longUrl])

const scoreVarsSelector = state => state.scoreVars
const votedSelector = state => state.voted
const shortUrlsSelector = state => state.shortUrls

const motionsShareUrlSelector = createSelector(
  votedSelector,
  shortUrlsSelector,
  (voted, shortUrls) => {
    return buildShareUrl({
      motionIds: _.keys(voted),
    })
  }
)

const motionsShortUrlSelector = createSelector(
  motionsShareUrlSelector,
  shortUrlsSelector,
  getShortUrl
)

const canShareMotionsSelector = createSelector(
  votedSelector,
  motionsShareUrlSelector,
  (voted, url) => {
    return !_.isEmpty(voted) && _.size(url) < 2048
  }
)

const votedShareUrlSelector = createSelector(
  votedSelector,
  shortUrlsSelector,
  scoreVarsSelector,
  (voted, shortUrls, scoreVars) => {
    return buildShareUrl({
      scoreVars,
      voted,
    })
  }
)

const votedShortUrlSelector = createSelector(
  votedShareUrlSelector,
  shortUrlsSelector,
  getShortUrl
)

const votedStatsSelector = createSelector(
  votedSelector,
  (voted) => _.countBy(voted, (voted) => voted ? voted : null)
)

const isAllVotedSelector = createSelector(
  votedStatsSelector,
  (stats) => !stats[null]
)

const canShareVotedSelector = createSelector(
  votedSelector,
  votedShareUrlSelector,
  isAllVotedSelector,
  (voted, url, isAllVoted) => {
    return isAllVoted && !_.isEmpty(voted) && _.size(url) < 2048
  }
)

const canShareSelector = createSelector(
  canShareMotionsSelector,
  canShareVotedSelector,
  (canShareMotions, canShareVoted) => {
    return canShareMotions || canShareVoted
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

const activeTabSelector = createSelector(
  state => state.activeTab,
  votedSelector,
  (activeTab, voted) => _.isEmpty(voted) ? 1 : activeTab
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
  state => state.scoreVars,
  (motions, voted, members, scoreVars) => {
    return _.sortBy(_.map(members, (member, memberName) => {
      const matching = _.reduce(voted, (r, vote, motionId) => {
        const memberVote = member.votes[motionId]
        if (memberVote === vote) {
          r.score += scoreVars[vote]
          r[vote] += 1
        } else if (memberVote === getOppositeVote(vote)) {
          r.score += scoreVars['opposite']
          r['opposite'] += 1
        } else if (memberVote) {
          r.score += scoreVars['novote']
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

class DateRangeFilter extends Component {
  componentDidMount() {
    $(this._input).daterangepicker({
      autoApply: true,
      locale: {
        format: DATE_FORMAT,
      },
      showDropdowns: true,
      ..._.pick(this.props, [
        'startDate', 'endDate',
        'minDate', 'maxDate',
      ])
    })
    .on('change', this.props.onChange)
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

const VoteDateDropdown = ({ motion }) => {
  const urls = getUrls(motion)
  return (
    <DropdownButton
      bsStyle="link"
      title={motion.voteDate}
      id={`vote-date-dropdown-${motion.id}`}
      style={{paddingLeft: 0, paddingRight: 0}}
    >
      {_.reduce([
        ['agenda', '會議議程'],
        ['rundown', '會議過程正式紀錄'],
        ['minutesPdf', '會議紀要 PDF'],
        ['results', '決定的紀錄'],
        ['votingPdf', '投票結果 PDF'],
        ['votingResults', '投票結果'],
      ], (r, [k, title], i) => {
        const url = urls[k]
        if (url) {
          r.push(<MenuItem key={i} href={url} rel="nofollow" target="_blank">{title}</MenuItem>)
        }
        return r
      }, [])}
      <MenuItem divider />
      <MenuItem href={urls.index} rel="nofollow" target="_blank">會議</MenuItem>
    </DropdownButton>
  )
}

const renderMotionVote = ({ motions, voted, onVoteYes, onVoteNo, onRemoveMotion }) => (i) => {
  const motion = motions[i]
  return (
    <div key={i} className="form-group list-group-item lead">
      <h4 className="list-group-item-heading">
        <Clearfix style={{margin: '0.5rem 0 1.5rem'}}>
          {_.has(voted, motion.id) && <CloseButton onClick={() => onRemoveMotion(motion.id)} />}
          <VoteDateDropdown motion={motion} />
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

const VoteSectionHeader = ({ activeTab, onSelectTab, votedCount, isAllVoted, canShare }) => {
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
        <NavItem eventKey={4} disabled={!canShare}>分享</NavItem>
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

const PageNavbar = ({ currentNav }) => {
  return (
    <Navbar staticTop>
      <Navbar.Header>
        <Navbar.Brand active>
          <a href="#">立法會投票傾向配對</a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
      <Navbar.Collapse>
        <Nav>
          {_.map([
            ['vote', '議案投票'],
            // ['stats', '數據統計'],
            ['limitation', '注意事項'],
            ['about', '關於本網'],
          ], ([hash, title], i) => {
            return (
              <NavItem
                key={i}
                eventKey={hash}
                href={`#${hash}`}
                active={currentNav === hash}
              >{title}</NavItem>
            )
          })}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

const ScoreForm = ({ defaultExpanded, title, children }) => {
  return (
    <Panel header={title} collapsible defaultExpanded={defaultExpanded} bsStyle="info">
      <form className="form-horizontal">
        {children}
      </form>
    </Panel>
  )
}

const ScoreFormGroup = ({ title, ...props }) => {
  return (
    <FormGroup>
      <ControlLabel className="col-sm-2">{title}</ControlLabel>
      <div className="col-sm-10">
        <FormControl type="number" {...props} />
      </div>
    </FormGroup>
  )
}

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
    const { currentNav, data } = this.state
    if (!data) {
      return <div>載入議案資料中⋯⋯</div>
    }
    const upStyle = {
      position: 'fixed',
      bottom: 120,
      right: 30,
      cursor: 'pointer',
      transitionDuration: '0.2s',
      transitionTimingFunction: 'linear',
      transitionDelay: '0s',
    }
    return (
      <div style={{paddingBottom: 20}}>
        <PageNavbar currentNav={currentNav} />
          {{
            'vote': this.renderMainSection,
            'stats': this.renderStatsSection,
            'limitation': this.renderLimitationSection,
            'about': this.renderAboutSection,
          }[currentNav].call(this)}
        <ScrollToTop showUnder={160} style={upStyle}>
          <img src="/images/up.png" alt="移至頂部" />
        </ScrollToTop>
      </div>
    )
  }

  renderMainSection() {
    const { data, voted } = this.state
    const activeTab = activeTabSelector(this.state)
    return (
      <Grid>
        <VoteSectionHeader
          activeTab={activeTab}
          onSelectTab={(eventKey) => this.setState({ activeTab: eventKey })}
          votedCount={votedCountSelector(this.state)}
          isAllVoted={isAllVotedSelector(this.state)}
          canShare={canShareSelector(this.state)}
        />
        {[
          this.renderFilterVotesTab,
          this.renderSelectedVotesTab,
          this.renderResultTab,
          this.renderShareTab,
        ][activeTab - 1].call(this)}
      </Grid>
    )
  }

  renderStatsSection() {
    return (
      <div>stats</div>
    )
  }

  renderLimitationSection() {
    return (
      <LimitationSection />
    )
  }

  renderAboutSection() {
    return <AboutSection />
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
            type='simple'
          />
        )}
      </Panel>
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
            type='simple'
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
    })
  }

  onRemoveEmptyMotions = () => {
    const voted = _.omitBy(this.state.voted, _.isEmpty)
    this.setState({
      voted,
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
