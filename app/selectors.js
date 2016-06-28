import queryString from 'query-string'
import _ from 'lodash'
import { createSelector } from 'reselect'
import Fuse from 'fuse.js'

import { buildShareUrl, decompress, convertMotionIdsToVoted, getCurrentNav } from './util'


const getShortUrl = (longUrl, shortUrls) => _.get(shortUrls, [longUrl])

const scoreVarsSelector = state => state.scoreVars
const votedSelector = state => state.voted
const shortUrlsSelector = state => state.shortUrls

export const motionsShareUrlSelector = createSelector(
  votedSelector,
  shortUrlsSelector,
  (voted, shortUrls) => {
    return buildShareUrl({
      motionIds: _.keys(voted),
    })
  }
)

export const motionsShortUrlSelector = createSelector(
  motionsShareUrlSelector,
  shortUrlsSelector,
  getShortUrl
)

export const canShareMotionsSelector = createSelector(
  votedSelector,
  motionsShareUrlSelector,
  (voted, _url) => {
    return !_.isEmpty(voted) && _.size(_url) < 2048
  }
)

export const votedShareUrlSelector = createSelector(
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

export const votedShortUrlSelector = createSelector(
  votedShareUrlSelector,
  shortUrlsSelector,
  getShortUrl
)

export const votedStatsSelector = createSelector(
  votedSelector,
  (voted) => _.countBy(voted, (_voted = null) => _voted)
)

export const isAllVotedSelector = createSelector(
  votedStatsSelector,
  (stats) => !stats[null]
)

export const canShareVotedSelector = createSelector(
  votedSelector,
  votedShareUrlSelector,
  isAllVotedSelector,
  (voted, _url, isAllVoted) => {
    return isAllVoted && !_.isEmpty(voted) && _.size(_url) < 2048
  }
)

export const canShareSelector = createSelector(
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

export const filterMotionsSelector = createSelector(
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
    return _.sortBy(filteredMotions, 'voteDateMoment').reverse()
  }
)

export const votedMotionsSelector = createSelector(
  state => state.data.motions,
  votedSelector,
  (motions, voted) => _.filter(motions, (motion) => {
    return !_.isUndefined(_.get(voted, [motion.id]))
  })
)

export const activeTabSelector = createSelector(
  state => state.activeTab,
  votedSelector,
  (activeTab, voted) => (_.isEmpty(voted) && activeTab <= 4 ? 1 : activeTab)
)

const getOppositeVote = (vote) => {
  return {
    yes: 'no',
    no: 'yes',
  }[vote]
}

export const matchResultSelector = createSelector(
  state => state.data.motions,
  votedSelector,
  state => state.data.members,
  state => state.scoreVars,
  (motions, voted, members, scoreVars) => {
    return _.sortBy(_.map(members, (member, memberName) => {
      const matching = _.reduce(voted, (r, vote, motionId) => {
        const memberVote = member.votes[motionId]
        if (memberVote === vote) {
          r.score += scoreVars[vote]  // eslint-disable-line
          r[vote] += 1  // eslint-disable-line
        } else if (memberVote === getOppositeVote(vote)) {
          r.score += scoreVars['opposite']  // eslint-disable-line
          r['opposite'] += 1  // eslint-disable-line
        } else if (memberVote) {
          r.score += scoreVars['novote']  // eslint-disable-line
          r['novote'] += 1  // eslint-disable-line
          r[memberVote] += 1  // eslint-disable-line
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

export const maxDateSelector = createSelector(
  motionDatesSelector,
  motionDates => _.max(motionDates)
)

export const minDateSelector = createSelector(
  motionDatesSelector,
  motionDates => _.min(motionDates)
)

export const votedCountSelector = createSelector(
  votedSelector,
  (voted) => _.size(voted)
)

export const initialStateFromUrl = () => {
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
