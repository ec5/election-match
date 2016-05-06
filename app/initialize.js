/* globals $,moment */
import _ from 'lodash'

import { createSelector } from 'reselect'
import { render } from 'react-dom'
import React, { Component } from 'react'

import Badge from 'react-bootstrap/lib/Badge'
import FormControl from 'react-bootstrap/lib/FormControl'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'

import { AutoSizer, VirtualScroll } from 'react-virtualized'
import ReactList from 'react-list'
import ScrollToTop from 'react-scroll-up'

import Fuse from 'fuse.js'

const DATE_FORMAT = 'DD/MM/YYYY'
const scoreAdjustment = {
  yes: 1,
  no: 1,
  opposite: -1,
  novote: 0,
}

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
  state => state.voted,
  (motions, voted) => _.filter(motions, (motion) => {
    return _.get(voted, [motion.id])
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
  state => state.voted,
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

const renderMotionVote = ({ motions, voted, onVoteYes, onVoteNo }) => (i) => {
  const motion = motions[i]
  return (
    <div key={i} className="form-group list-group-item lead">
      <h4 className="list-group-item-heading">
        {motion.title}
        <div style={{textAlign: 'right'}}>
          <small>投票日期：{motion.voteDate}</small>
        </div>
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

const VoteSectionHeader = ({ activeTab, onSelectTab, votedCount }) => {
  return (
    <header>
      <h2>議案投票</h2>
      <p className="lead">假如你是立法會議員，你會如何投票？</p>
      <Nav bsStyle="tabs" activeKey={activeTab} onSelect={onSelectTab}>
        <NavItem eventKey={1}>選取議案</NavItem>
        {votedCount > 0 && [
          <NavItem key={2} eventKey={2}>你的投票 <Badge>{votedCount}</Badge></NavItem>,
          <NavItem key={3} eventKey={3}>配對結果</NavItem>,
        ]}
      </Nav>
    </header>
  )
}

class ElectionMatch extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      activeTab: 1,
      filterText: '',
    }
  }

  componentDidMount() {
    $.getJSON('data.json', (data) => {
      _.each(data.motions, (motion, motionId) => {
        motion.id = motionId
        motion.group = `${motion.meetingType} - ${motion.voteDate}`
        motion.voteDateMoment = moment(motion.voteDate, DATE_FORMAT)
      })

      const motionDates = _.map(data.motions, 'voteDateMoment')
      const maxDate = _.max(motionDates)
      const minDate = _.min(motionDates)

      this.setState({
        data,
        maxDate,
        minDate,
        startDate: minDate,
        endDate: maxDate,
      })
    })
  }

  render() {
    const { data, activeTab, voted } = this.state
    if (!data) {
      return <div>載入議案資料中⋯⋯</div>
    }
    return (
      <div>
        <section>
          <VoteSectionHeader
            activeTab={activeTab}
            onSelectTab={(eventKey) => this.setState({ activeTab: eventKey })}
            votedCount={_.size(voted)}
          />
          {[
            this.renderFilterVotesTab(),
            this.renderSelectedVotesTab(),
            this.renderResultTab(),
          ][activeTab - 1]}
        </section>
        <ScrollToTop showUnder={160}>
          <span>移至頂部</span>
        </ScrollToTop>
      </div>
    )
  }

  renderFilterVotesTab() {
    const { data, voted, minDate, maxDate, startDate, endDate } = this.state
    const motions = filterMotionsSelector(this.state)
    return (
      <div>
        <DateRangeFilter
          minDate={minDate}
          maxDate={maxDate}
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
            })}
            length={motions.length}
            type='simple'
          />
        )}
      </div>
    )
  }

  renderSelectedVotesTab() {
    const { voted } = this.state
    const motions = votedMotionsSelector(this.state)
    return (
      <div>
        {_.isEmpty(motions) ? <p className="text-warning">未有投票</p> : (
          <ReactList
            itemRenderer={renderMotionVote({
              motions,
              voted,
              onVoteYes: this.onVote('yes'),
              onVoteNo: this.onVote('no'),
            })}
            length={motions.length}
            type='simple'
          />
        )}
      </div>
    )
  }

  renderResultTab() {
    const matchResult = matchResultSelector(this.state)
    return (
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
}

document.addEventListener('DOMContentLoaded', () => {
  render(<ElectionMatch />, document.getElementById('app'))
})
