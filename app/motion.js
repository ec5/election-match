/* globals moment */
import _ from 'lodash'

export const DATE_FORMAT = 'DD/MM/YYYY'

export const getUrls = ({ meetingType, startDate, voteDateMoment }) => {
  const m = moment(startDate, DATE_FORMAT)
  const startYear = (m.month() >= 9 ? m.year() : m.year() - 1) % 100
  const yr = `${startYear}-${startYear + 1}`
  const prefix = `http://www.legco.gov.hk/yr${yr}/chinese/`
  const dateStr = m.format('YYYYMMDD')
  const meeting = {
    'Council Meeting': {
      urls: {
        index: `http://www.legco.gov.hk/general/chinese/counmtg/yr12-16/mtg_${startYear}${startYear + 1}.htm`,
        agenda: `${prefix}counmtg/agenda/cm${dateStr}.htm`,
        minutesPdf: `${prefix}counmtg/minutes/cm${dateStr}.pdf`,
        votingPdf: `${prefix}counmtg/voting/v${dateStr}.pdf`,
        rundown: `http://www.legco.gov.hk/php/hansard/chinese/rundown.php?date=${voteDateMoment.format('YYYY-MM-DD')}&lang=1`,
      },
    },
    'Establishment Subcommittee': {
      index: 'fc/esc/general/meetings.htm',
      code: 'esc',
      prefix: `${prefix}fc/esc`,
      props: ['agenda', 'minutesPdf'],
    },
    'Finance Committee': {
      index: `fc/fc/general/meetings.htm`,
      code: 'fc',
      prefix: `${prefix}fc/fc`,
      props: ['agenda', 'minutesPdf', 'results', 'votingResults'],
    },
    'House Committee': {
      index: `hc/general/hc_mtg.htm`,
      code: 'hc',
      prefix: `${prefix}hc`,
      props: ['agenda', 'minutesPdf'],
    },
    'Public Works Subcommittee': {
      index: `fc/pwsc/general/meetings.htm`,
      code: 'pwsc',
      prefix: `${prefix}fc/pwsc`,
      props: ['agenda', 'minutesPdf', 'results'],
    },
  }[meetingType]

  if (meeting.urls) {
    return meeting.urls
  }

  const urls = _.pick({
    agenda: `${meeting.prefix}/agenda/${meeting.code}${dateStr}.htm`,
    minutesPdf: `${meeting.prefix}/minutes/${meeting.code}${dateStr}.pdf`,
    results: `${meeting.prefix}/results/${meeting.code}${dateStr}.htm`,
    votingPdf: `${meeting.prefix}/voting/v${dateStr}.pdf`,
    votingResults: `${meeting.prefix}/results/v${dateStr}.htm`,
  }, meeting.props)
  urls.index = `${meeting.prefix}${meeting.index}`
  return urls
}
